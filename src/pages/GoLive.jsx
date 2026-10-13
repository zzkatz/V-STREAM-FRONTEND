import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Container, Button, Input2, Spinner } from "../components";
import {
    createLiveStream,
    fetchLiveQuota,
} from "../store/Slices/liveSlice";

function formatSec(sec) {
    if (!Number.isFinite(sec)) return "--:--";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
}

function GoLive() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const quota = useSelector((state) => state.live.quota);
    const quotaLoading = useSelector((state) => state.live.quotaLoading);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [visibility, setVisibility] = useState("public");
    const [previewStream, setPreviewStream] = useState(null);
    const [previewError, setPreviewError] = useState("");
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        dispatch(fetchLiveQuota());
    }, [dispatch]);

    useEffect(() => {
        if (quota?.hasActiveStream && quota?.activeStreamId) {
            navigate(`/live/${quota.activeStreamId}`, { replace: true });
        }
    }, [quota?.hasActiveStream, quota?.activeStreamId, navigate]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const media = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 640, max: 640 },
                        height: { ideal: 360, max: 360 },
                    },
                    audio: true,
                });
                if (!cancelled) {
                    setPreviewStream(media);
                    setPreviewError("");
                } else {
                    media.getTracks().forEach((t) => t.stop());
                }
            } catch {
                if (!cancelled) {
                    setPreviewError(
                        "Camera/microphone permission is required to go live."
                    );
                }
            }
        })();

        return () => {
            cancelled = true;
            setPreviewStream((prev) => {
                prev?.getTracks().forEach((t) => t.stop());
                return null;
            });
        };
    }, []);

    const handleStart = async () => {
        if (!title.trim()) return;
        if ((quota?.remainingSec ?? 0) <= 0) return;
        setStarting(true);
        try {
            previewStream?.getTracks().forEach((t) => t.stop());
            setPreviewStream(null);

            const created = await dispatch(
                createLiveStream({ title, description, visibility })
            ).unwrap();

            navigate(`/live/${created.streamId}`, { replace: true });
        } catch {
            // toast handled in slice
        } finally {
            setStarting(false);
        }
    };

    return (
        <Container>
            <div className="text-white max-w-2xl mx-auto py-6 space-y-5 px-3">
                <div>
                    <h1 className="text-2xl font-semibold">Go Live</h1>
                    <p className="text-sm text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                        Max quality 360p ·{" "}
                        {quotaLoading && !quota ? (
                            <Spinner width={4} />
                        ) : (
                            <span>
                                Used{" "}
                                <span className="text-white">
                                    {formatSec(quota?.usedSec ?? 0)}
                                </span>
                                {" · "}
                                Remaining{" "}
                                <span className="text-white">
                                    {formatSec(quota?.remainingSec)}
                                </span>
                                {" of "}
                                {formatSec(quota?.dailyQuotaSec || 900)}
                                {" (UTC day)"}
                            </span>
                        )}
                    </p>
                </div>

                <div className="aspect-video w-full bg-black rounded overflow-hidden border border-slate-700">
                    {previewError ? (
                        <div className="h-full flex items-center justify-center text-sm text-red-400 p-4 text-center">
                            {previewError}
                        </div>
                    ) : previewStream ? (
                        <video
                            autoPlay
                            muted
                            playsInline
                            ref={(el) => {
                                if (el && previewStream) {
                                    el.srcObject = previewStream;
                                }
                            }}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                            Starting camera preview…
                        </div>
                    )}
                </div>

                <Input2
                    label="Stream title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What are you streaming?"
                />
                <label className="block text-sm space-y-1">
                    <span className="text-slate-300">Description (optional)</span>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-[#222222] border border-slate-600 rounded px-3 py-2 outline-none focus:border-purple-500 min-h-[80px]"
                    />
                </label>
                <label className="block text-sm space-y-1">
                    <span className="text-slate-300">Visibility</span>
                    <select
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value)}
                        className="w-full bg-[#222222] border border-slate-600 rounded px-3 py-2"
                    >
                        <option value="public">Public (listed)</option>
                        <option value="unlisted">Unlisted (link only)</option>
                    </select>
                </label>

                <Button
                    className="bg-purple-600 hover:bg-purple-500 px-4 py-2 w-full sm:w-auto disabled:opacity-50"
                    onClick={handleStart}
                    disabled={
                        starting ||
                        !title.trim() ||
                        !!previewError ||
                        (quota?.remainingSec ?? 0) <= 0
                    }
                >
                    {starting ? "Starting…" : "Start Live"}
                </Button>
            </div>
        </Container>
    );
}

export default GoLive;
