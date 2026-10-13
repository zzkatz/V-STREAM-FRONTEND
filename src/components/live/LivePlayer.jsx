import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    LiveKitRoom,
    RoomAudioRenderer,
    VideoTrack,
    useTracks,
    useConnectionState,
    useParticipants,
    useRoomContext,
} from "@livekit/components-react";
import { ConnectionState, Track } from "livekit-client";
import "@livekit/components-styles";
import Spinner from "../Spinner";
import { FaDesktop } from "react-icons/fa";

const VIDEO_CONSTRAINTS = {
    resolution: { width: 640, height: 360, frameRate: 24 },
    facingMode: "user",
};

function formatRemaining(sec) {
    if (!Number.isFinite(sec) || sec < 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
}

function pickRecorderMime() {
    const candidates = [
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=vp9,opus",
        "video/webm",
    ];
    return candidates.find((t) => MediaRecorder.isTypeSupported?.(t)) || "";
}

function LocalRecordingController({ enabled, apiRef }) {
    const room = useRoomContext();
    const recorderRef = useRef(null);
    const chunksRef = useRef([]);
    const mimeRef = useRef("");
    const videoTrackIdRef = useRef(null);
    const audioTrackIdRef = useRef(null);
    const stoppingRef = useRef(false);
    const canvasRef = useRef(null);
    const videoElRef = useRef(null);
    const rafRef = useRef(null);
    const captureStreamRef = useRef(null);

    const tearDownCapture = () => {
        if (rafRef.current != null) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        const capture = captureStreamRef.current;
        if (capture) {
            // Only stop canvas-generated tracks — never stop LiveKit mic/camera tracks.
            capture.getVideoTracks().forEach((t) => {
                try {
                    t.stop();
                } catch {
                    // ignore
                }
            });
            capture.getAudioTracks().forEach((t) => {
                try {
                    capture.removeTrack(t);
                } catch {
                    // ignore
                }
            });
            captureStreamRef.current = null;
        }
        const videoEl = videoElRef.current;
        if (videoEl) {
            videoEl.pause();
            videoEl.srcObject = null;
            videoElRef.current = null;
        }
        canvasRef.current = null;
    };

    const ensurePipeline = () => {
        if (canvasRef.current && videoElRef.current && captureStreamRef.current) {
            return captureStreamRef.current;
        }

        const videoEl = document.createElement("video");
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.autoplay = true;
        videoElRef.current = videoEl;

        const canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 360;
        canvasRef.current = canvas;
        const ctx = canvas.getContext("2d", { alpha: false });

        const draw = () => {
            if (!videoElRef.current || !canvasRef.current) return;
            const v = videoElRef.current;
            const c = canvasRef.current;
            if (v.readyState >= 2 && v.videoWidth > 0) {
                const vw = v.videoWidth;
                const vh = v.videoHeight;
                const scale = Math.min(c.width / vw, c.height / vh);
                const dw = vw * scale;
                const dh = vh * scale;
                const dx = (c.width - dw) / 2;
                const dy = (c.height - dh) / 2;
                ctx.fillStyle = "#000";
                ctx.fillRect(0, 0, c.width, c.height);
                ctx.drawImage(v, dx, dy, dw, dh);
            }
            rafRef.current = requestAnimationFrame(draw);
        };
        rafRef.current = requestAnimationFrame(draw);

        const capture = canvas.captureStream(24);
        captureStreamRef.current = capture;
        return capture;
    };

    const bindVideoSource = (videoMedia) => {
        const videoEl = videoElRef.current;
        if (!videoEl || !videoMedia) return;
        videoEl.srcObject = new MediaStream([videoMedia]);
        const playPromise = videoEl.play();
        if (playPromise?.catch) {
            playPromise.catch(() => {});
        }
        videoTrackIdRef.current = videoMedia.id;
    };

    const bindAudioTrack = (audioMedia) => {
        const capture = captureStreamRef.current;
        if (!capture) return;

        const existing = capture.getAudioTracks()[0];
        if (existing && audioTrackIdRef.current === audioMedia?.id) return;

        if (existing) {
            try {
                capture.removeTrack(existing);
            } catch {
                // ignore
            }
        }
        audioTrackIdRef.current = null;

        if (audioMedia && audioMedia.readyState !== "ended") {
            try {
                capture.addTrack(audioMedia);
                audioTrackIdRef.current = audioMedia.id;
            } catch {
                // ignore
            }
        }
    };

    const stopRecorder = () =>
        new Promise((resolve) => {
            const recorder = recorderRef.current;
            if (!recorder || recorder.state === "inactive") {
                resolve();
                return;
            }
            const finish = () => {
                recorderRef.current = null;
                resolve();
            };
            recorder.onstop = finish;
            try {
                if (recorder.state === "recording") {
                    recorder.requestData();
                }
                recorder.stop();
            } catch {
                finish();
            }
        });

    const startRecorderWhenReady = () => {
        if (stoppingRef.current || recorderRef.current?.state === "recording") {
            return;
        }
        const capture = captureStreamRef.current;
        const videoEl = videoElRef.current;
        if (!capture || !videoEl) return;

        // Wait until the hidden video element has real frames.
        if (videoEl.readyState < 2 || !videoEl.videoWidth) {
            setTimeout(startRecorderWhenReady, 200);
            return;
        }

        const mimeType = pickRecorderMime();
        mimeRef.current = mimeType || "video/webm";
        try {
            const recorder = new MediaRecorder(capture, {
                ...(mimeType ? { mimeType } : {}),
                videoBitsPerSecond: 600_000,
                audioBitsPerSecond: 64_000,
            });
            recorder.ondataavailable = (e) => {
                if (e.data?.size) chunksRef.current.push(e.data);
            };
            recorder.start(1000);
            recorderRef.current = recorder;
        } catch (err) {
            console.error("MediaRecorder start failed:", err);
            tearDownCapture();
        }
    };

    const syncTracks = () => {
        if (!enabled || !room?.localParticipant || stoppingRef.current) return;
        const lp = room.localParticipant;
        const screenPub = lp.getTrackPublication(Track.Source.ScreenShare);
        const camPub = lp.getTrackPublication(Track.Source.Camera);
        const micPub = lp.getTrackPublication(Track.Source.Microphone);

        const videoMedia =
            screenPub?.track?.mediaStreamTrack ||
            camPub?.track?.mediaStreamTrack;
        const audioMedia = micPub?.track?.mediaStreamTrack;

        // Never start audio-only — that produces a black VOD.
        if (!videoMedia) return;

        ensurePipeline();
        if (videoTrackIdRef.current !== videoMedia.id) {
            bindVideoSource(videoMedia);
        }
        bindAudioTrack(audioMedia);
        startRecorderWhenReady();
    };

    const stopAndGetBlob = () =>
        new Promise(async (resolve) => {
            stoppingRef.current = true;
            try {
                await stopRecorder();
                const chunks = chunksRef.current;
                const type = mimeRef.current || "video/webm";
                const blob =
                    chunks.length > 0 ? new Blob(chunks, { type }) : null;
                chunksRef.current = [];
                videoTrackIdRef.current = null;
                audioTrackIdRef.current = null;
                tearDownCapture();
                resolve(blob?.size > 0 ? blob : null);
            } catch {
                resolve(null);
            }
        });

    useImperativeHandle(
        apiRef,
        () => ({
            stopAndGetBlob,
        }),
        []
    );

    useEffect(() => {
        if (!enabled || !room?.localParticipant) return undefined;

        stoppingRef.current = false;
        const t = setTimeout(syncTracks, 800);
        const onTrack = () => syncTracks();
        room.localParticipant.on("localTrackPublished", onTrack);
        room.localParticipant.on("localTrackUnpublished", onTrack);

        return () => {
            clearTimeout(t);
            room.localParticipant.off("localTrackPublished", onTrack);
            room.localParticipant.off("localTrackUnpublished", onTrack);
            if (!stoppingRef.current) {
                const recorder = recorderRef.current;
                if (recorder && recorder.state !== "inactive") {
                    try {
                        recorder.stop();
                    } catch {
                        // ignore
                    }
                }
                recorderRef.current = null;
                videoTrackIdRef.current = null;
                audioTrackIdRef.current = null;
                tearDownCapture();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- sync via room events
    }, [enabled, room]);

    return null;
}

function ScreenShareControls() {
    const room = useRoomContext();
    const [sharing, setSharing] = useState(false);
    const [busy, setBusy] = useState(false);

    const toggleShare = async () => {
        if (!room?.localParticipant || busy) return;
        setBusy(true);
        try {
            const next = !sharing;
            await room.localParticipant.setScreenShareEnabled(next, {
                audio: true,
                resolution: { width: 640, height: 360, frameRate: 15 },
            });
            setSharing(next);
        } catch {
            // user cancelled picker or unsupported
        } finally {
            setBusy(false);
        }
    };

    return (
        <button
            type="button"
            onClick={toggleShare}
            disabled={busy}
            className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded border ${
                sharing
                    ? "bg-purple-600 border-purple-500"
                    : "bg-[#222222] border-slate-600 hover:border-purple-500"
            } disabled:opacity-50`}
        >
            <FaDesktop size={14} />
            {sharing ? "Stop sharing" : "Share screen"}
        </button>
    );
}

function LiveStage({ isPublisher }) {
    const connectionState = useConnectionState();
    const participants = useParticipants();
    const tracks = useTracks(
        [
            { source: Track.Source.Camera, withPlaceholder: true },
            { source: Track.Source.ScreenShare, withPlaceholder: false },
        ],
        { onlySubscribed: !isPublisher }
    );

    const screenTrack = useMemo(() => {
        if (isPublisher) {
            return tracks.find(
                (t) =>
                    t.participant.isLocal &&
                    t.source === Track.Source.ScreenShare
            );
        }
        return tracks.find(
            (t) =>
                !t.participant.isLocal &&
                t.source === Track.Source.ScreenShare
        );
    }, [tracks, isPublisher]);

    const cameraTrack = useMemo(() => {
        if (isPublisher) {
            return tracks.find(
                (t) => t.participant.isLocal && t.source === Track.Source.Camera
            );
        }
        return tracks.find(
            (t) => !t.participant.isLocal && t.source === Track.Source.Camera
        );
    }, [tracks, isPublisher]);

    const primary = screenTrack || cameraTrack;

    if (
        connectionState === ConnectionState.Connecting ||
        connectionState === ConnectionState.Reconnecting
    ) {
        return (
            <div className="aspect-video w-full bg-black flex flex-col items-center justify-center gap-2 text-white">
                <Spinner width={10} />
                <p className="text-sm text-slate-300">
                    {connectionState === ConnectionState.Reconnecting
                        ? "Reconnecting…"
                        : "Connecting…"}
                </p>
            </div>
        );
    }

    if (connectionState === ConnectionState.Disconnected) {
        return (
            <div className="aspect-video w-full bg-black flex items-center justify-center text-white text-sm">
                Disconnected from stream
            </div>
        );
    }

    return (
        <div className="relative aspect-video w-full bg-black overflow-hidden">
            {primary?.publication?.track ? (
                <VideoTrack
                    trackRef={primary}
                    className="absolute inset-0 w-full h-full object-contain"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                    {isPublisher
                        ? "Waiting for camera…"
                        : "Waiting for broadcaster…"}
                </div>
            )}
            {screenTrack && cameraTrack?.publication?.track && (
                <div className="absolute bottom-3 right-3 w-28 sm:w-40 aspect-video border border-slate-500 bg-black overflow-hidden">
                    <VideoTrack
                        trackRef={cameraTrack}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                    LIVE
                </span>
                <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                    {Math.max(0, participants.length)} in room
                </span>
                {screenTrack && (
                    <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                        Screen
                    </span>
                )}
            </div>
        </div>
    );
}

const LivePlayer = forwardRef(function LivePlayer(
    {
        serverUrl,
        token,
        isPublisher = false,
        remainingSec,
        onDisconnected,
        onQuotaTick,
        roomKey,
    },
    ref
) {
    const [localRemaining, setLocalRemaining] = useState(remainingSec);
    const recordingApiRef = useRef(null);

    useImperativeHandle(
        ref,
        () => ({
            stopAndGetBlob: () =>
                recordingApiRef.current?.stopAndGetBlob?.() ??
                Promise.resolve(null),
        }),
        []
    );

    useEffect(() => {
        if (Number.isFinite(remainingSec)) {
            setLocalRemaining((prev) => {
                if (!Number.isFinite(prev)) return remainingSec;
                if (Math.abs(prev - remainingSec) >= 2) return remainingSec;
                return prev;
            });
        }
    }, [remainingSec]);

    useEffect(() => {
        if (!isPublisher) return undefined;
        const id = setInterval(() => {
            setLocalRemaining((prev) => {
                if (!Number.isFinite(prev) || prev <= 0) return prev;
                const next = Math.max(0, prev - 1);
                onQuotaTick?.(next);
                return next;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [isPublisher, onQuotaTick]);

    if (!serverUrl || !token) {
        return (
            <div className="aspect-video w-full bg-black flex items-center justify-center text-slate-400 text-sm">
                Preparing stream…
            </div>
        );
    }

    return (
        <div className="w-full space-y-2">
            <LiveKitRoom
                key={roomKey || token}
                serverUrl={serverUrl}
                token={token}
                connect
                video={
                    isPublisher
                        ? {
                              resolution: VIDEO_CONSTRAINTS.resolution,
                          }
                        : false
                }
                audio={isPublisher}
                onDisconnected={onDisconnected}
                options={{
                    disconnectOnPageLeave: !isPublisher,
                    publishDefaults: {
                        videoEncoding: {
                            maxBitrate: 600_000,
                            maxFramerate: 24,
                        },
                        screenShareEncoding: {
                            maxBitrate: 800_000,
                            maxFramerate: 15,
                        },
                        videoCodec: "vp8",
                    },
                    videoCaptureDefaults: {
                        resolution: VIDEO_CONSTRAINTS.resolution,
                    },
                }}
                data-lk-theme="default"
                className="w-full"
            >
                <LiveStage isPublisher={isPublisher} />
                <RoomAudioRenderer />
                {isPublisher && (
                    <>
                        <LocalRecordingController
                            enabled
                            apiRef={recordingApiRef}
                        />
                        <div className="mt-2">
                            <ScreenShareControls />
                        </div>
                    </>
                )}
            </LiveKitRoom>
            {isPublisher && Number.isFinite(localRemaining) && (
                <p className="text-sm text-slate-300">
                    Remaining today:{" "}
                    <span className="text-white font-medium">
                        {formatRemaining(localRemaining)}
                    </span>
                </p>
            )}
        </div>
    );
});

export default LivePlayer;
