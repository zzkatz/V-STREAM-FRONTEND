import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    Container,
    Button,
    EndStreamConfirmation,
    Spinner,
    Video,
} from "../components";
import LivePlayer from "../components/live/LivePlayer";
import {
    checkpointLiveStream,
    clearLiveState,
    endLiveStream,
    fetchLiveQuota,
    fetchLiveStream,
    getLiveToken,
    uploadLiveRecording,
} from "../store/Slices/liveSlice";

const MAX_AUTO_REJOIN = 3;

function LiveWatch() {
    const { streamId } = useParams();
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.userData);
    const stream = useSelector((state) => state.live.currentStream);
    const tokenPayload = useSelector((state) => state.live.tokenPayload);
    const quota = useSelector((state) => state.live.quota);

    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");
    const [confirmEnd, setConfirmEnd] = useState(false);
    const [shareMsg, setShareMsg] = useState("");
    const [roomKey, setRoomKey] = useState(0);
    const [savingRecording, setSavingRecording] = useState(false);
    const rejoinAttempts = useRef(0);
    const intentionalEnd = useRef(false);
    const playerRef = useRef(null);

    const isHost =
        user?._id &&
        stream?.broadcaster?._id &&
        String(user._id) === String(stream.broadcaster._id);

    const join = useCallback(
        async ({ silent } = {}) => {
            if (!streamId) return;
            if (!silent) {
                setStatus("loading");
                setError("");
            }
            try {
                const meta = await dispatch(fetchLiveStream(streamId)).unwrap();
                if (meta.status !== "live") {
                    setStatus(
                        meta.status === "ended" ? "ended" : "unavailable"
                    );
                    return;
                }
                const host =
                    user?._id &&
                    meta.broadcaster?._id &&
                    String(user._id) === String(meta.broadcaster._id);
                await dispatch(
                    getLiveToken({
                        streamId,
                        role: host ? "publisher" : "viewer",
                    })
                ).unwrap();
                await dispatch(fetchLiveQuota());
                setRoomKey((k) => k + 1);
                setStatus("live");
                rejoinAttempts.current = 0;
            } catch (err) {
                const msg =
                    err?.response?.data?.message ||
                    err?.message ||
                    "Unable to join stream";
                setError(msg);
                setStatus("rejoin");
            }
        },
        [dispatch, streamId, user?._id]
    );

    useEffect(() => {
        intentionalEnd.current = false;
        join();
        return () => {
            dispatch(clearLiveState());
        };
    }, [join, dispatch]);

    useEffect(() => {
        if (!isHost || status !== "live" || !streamId) return undefined;
        const id = setInterval(() => {
            dispatch(checkpointLiveStream(streamId))
                .unwrap()
                .then(() => dispatch(fetchLiveQuota()))
                .catch(() => {
                    dispatch(fetchLiveStream(streamId))
                        .unwrap()
                        .then((meta) => {
                            if (meta.status !== "live") setStatus("ended");
                        })
                        .catch(() => setStatus("rejoin"));
                });
        }, 20000);
        return () => clearInterval(id);
    }, [isHost, status, streamId, dispatch]);

    const handleShare = async () => {
        const url = `${window.location.origin}/live/${streamId}`;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: stream?.title || "Live on Vestreams",
                    url,
                });
            } else {
                await navigator.clipboard.writeText(url);
                setShareMsg("Link copied");
                setTimeout(() => setShareMsg(""), 2000);
            }
        } catch {
            try {
                await navigator.clipboard.writeText(url);
                setShareMsg("Link copied");
                setTimeout(() => setShareMsg(""), 2000);
            } catch {
                setShareMsg("Could not copy link");
            }
        }
    };

    const flushRecordingUpload = async () => {
        let blob = null;
        try {
            blob = await playerRef.current?.stopAndGetBlob?.();
        } catch {
            blob = null;
        }
        if (!blob) return;
        setSavingRecording(true);
        try {
            await dispatch(
                uploadLiveRecording({ streamId, file: blob })
            ).unwrap();
            await dispatch(fetchLiveStream(streamId));
        } catch {
            // toast in slice
        } finally {
            setSavingRecording(false);
        }
    };

    const handleEnd = async () => {
        intentionalEnd.current = true;
        setConfirmEnd(false);
        // Capture the recording while LivePlayer is still mounted and tracks are live.
        setSavingRecording(true);
        let blob = null;
        try {
            blob = await playerRef.current?.stopAndGetBlob?.();
        } catch {
            blob = null;
        }
        setStatus("ending");
        try {
            await dispatch(endLiveStream(streamId)).unwrap();
            await dispatch(fetchLiveQuota());
            if (blob) {
                try {
                    await dispatch(
                        uploadLiveRecording({ streamId, file: blob })
                    ).unwrap();
                } catch {
                    // toast in slice
                }
            }
            await dispatch(fetchLiveStream(streamId));
            setStatus("ended");
        } catch {
            setStatus("live");
        } finally {
            setSavingRecording(false);
        }
    };

    const handleDisconnected = async () => {
        if (intentionalEnd.current) return;
        try {
            const meta = await dispatch(fetchLiveStream(streamId)).unwrap();
            if (meta.status !== "live") {
                if (isHost) await flushRecordingUpload();
                setStatus("ended");
                return;
            }
            if (rejoinAttempts.current < MAX_AUTO_REJOIN) {
                rejoinAttempts.current += 1;
                setStatus("reconnecting");
                const delay = 1000 * rejoinAttempts.current;
                setTimeout(() => join({ silent: true }), delay);
                return;
            }
            setStatus("rejoin");
        } catch {
            setStatus("rejoin");
        }
    };

    if (
        status === "loading" ||
        status === "reconnecting" ||
        status === "ending"
    ) {
        return (
            <div className="w-full flex flex-col items-center justify-center gap-3 py-20 text-white">
                <Spinner width={12} />
                <p className="text-sm text-slate-400">
                    {status === "reconnecting"
                        ? "Reconnecting to stream…"
                        : status === "ending"
                          ? "Ending stream…"
                          : "Loading stream…"}
                </p>
            </div>
        );
    }

    if (status === "ended") {
        const recording = stream?.recording;
        return (
            <Container>
                <div className="text-white max-w-4xl mx-auto py-6 space-y-4 px-3">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            {stream?.title || "Stream ended"}
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                            {stream?.broadcaster?.username
                                ? `@${stream.broadcaster.username}`
                                : "Broadcast ended"}
                        </p>
                        {stream?.description && (
                            <p className="text-sm text-slate-300 mt-2">
                                {stream.description}
                            </p>
                        )}
                    </div>

                    {savingRecording && (
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Spinner width={6} />
                            Saving recording to Cloudinary…
                        </div>
                    )}

                    {recording?.status === "ready" && recording?.url ? (
                        <Video
                            src={recording.url}
                            poster={stream?.thumbnail?.url}
                            title={stream?.title}
                        />
                    ) : recording?.status === "processing" || savingRecording ? (
                        <div className="aspect-video bg-black flex flex-col items-center justify-center gap-2 border border-slate-700">
                            <Spinner width={10} />
                            <p className="text-sm text-slate-400">
                                Processing recording…
                            </p>
                        </div>
                    ) : (
                        <div className="aspect-video bg-black flex flex-col items-center justify-center gap-2 border border-slate-700 text-slate-400 text-sm p-4 text-center">
                            {recording?.status === "failed"
                                ? "Recording upload failed."
                                : "No recording available for this stream."}
                            <Link
                                to="/live"
                                className="text-purple-400 underline"
                            >
                                Browse live streams
                            </Link>
                        </div>
                    )}
                </div>
            </Container>
        );
    }

    if (status === "unavailable") {
        return (
            <Container>
                <div className="text-white max-w-xl mx-auto py-16 text-center space-y-3 px-3">
                    <h1 className="text-2xl font-semibold">Unavailable</h1>
                    <p className="text-slate-400">
                        {error || "This stream is offline or does not exist."}
                    </p>
                    <Link to="/live" className="text-purple-400 underline">
                        Browse live streams
                    </Link>
                </div>
            </Container>
        );
    }

    if (status === "rejoin") {
        return (
            <Container>
                <div className="text-white max-w-xl mx-auto py-16 text-center space-y-4 px-3">
                    <h1 className="text-2xl font-semibold">Disconnected</h1>
                    <p className="text-slate-400">
                        {error ||
                            "Connection lost. You can try rejoining if the stream is still live."}
                    </p>
                    <div className="flex justify-center gap-3 flex-wrap">
                        <Button
                            className="bg-purple-600 hover:bg-purple-500 px-4 py-2"
                            onClick={() => {
                                rejoinAttempts.current = 0;
                                join();
                            }}
                        >
                            Rejoin
                        </Button>
                        <Link to="/live">
                            <Button className="bg-[#222222] border border-slate-600 px-4 py-2">
                                Back to Live
                            </Button>
                        </Link>
                    </div>
                </div>
            </Container>
        );
    }

    return (
        <Container>
            <div className="text-white max-w-5xl mx-auto py-4 space-y-4 px-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-red-600 text-xs font-bold px-2 py-0.5 rounded">
                                LIVE
                            </span>
                            {typeof stream?.viewerCount === "number" && (
                                <span className="text-xs text-slate-400">
                                    {stream.viewerCount} viewers
                                </span>
                            )}
                        </div>
                        <h1 className="text-xl sm:text-2xl font-semibold truncate">
                            {stream?.title}
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                            {stream?.broadcaster?.fullName ||
                                stream?.broadcaster?.username}
                            {stream?.broadcaster?.username
                                ? ` (@${stream.broadcaster.username})`
                                : ""}
                        </p>
                        {stream?.description && (
                            <p className="text-sm text-slate-300 mt-2">
                                {stream.description}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            className="bg-[#222222] border border-slate-600 px-3 py-2 text-sm"
                            onClick={handleShare}
                        >
                            Share
                        </Button>
                        {isHost && (
                            <Button
                                className="bg-red-600 hover:bg-red-500 px-3 py-2 text-sm disabled:opacity-50"
                                onClick={() => setConfirmEnd(true)}
                                disabled={savingRecording}
                            >
                                {savingRecording
                                    ? "Saving recording…"
                                    : "End Stream"}
                            </Button>
                        )}
                    </div>
                </div>
                {shareMsg && (
                    <p className="text-xs text-green-400">{shareMsg}</p>
                )}

                <LivePlayer
                    ref={playerRef}
                    roomKey={roomKey}
                    serverUrl={tokenPayload?.url}
                    token={tokenPayload?.token}
                    isPublisher={Boolean(isHost)}
                    remainingSec={isHost ? quota?.remainingSec : undefined}
                    onDisconnected={handleDisconnected}
                />

                {confirmEnd && !savingRecording && (
                    <EndStreamConfirmation
                        onCancel={() => setConfirmEnd(false)}
                        onConfirm={handleEnd}
                    />
                )}
            </div>
        </Container>
    );
}

export default LiveWatch;
