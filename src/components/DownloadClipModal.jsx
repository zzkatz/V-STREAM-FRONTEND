import React, { useEffect, useMemo, useRef, useState } from "react";
import { IoCloseCircleOutline } from "./icons";
import axiosInstance from "../helpers/axiosInstance";

const MIN_CLIP_DURATION_SEC = 1;
const MAX_CLIP_DURATION_SEC = 120;

function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const total = Math.floor(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
    const ss = String(s).padStart(2, "0");
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

async function readBlobError(error, fallback) {
    const data = error?.response?.data;
    if (data instanceof Blob) {
        try {
            const text = await data.text();
            const parsed = JSON.parse(text);
            if (typeof parsed?.message === "string" && parsed.message.trim()) {
                return parsed.message;
            }
        } catch {
            // ignore parse failures
        }
    }
    if (typeof data?.message === "string" && data.message.trim()) {
        return data.message;
    }
    return fallback;
}

function DownloadClipModal({
    videoId,
    currentTime = 0,
    duration = 0,
    onClose,
}) {
    const [start, setStart] = useState(() =>
        Math.max(0, Math.floor(currentTime * 10) / 10)
    );
    const [end, setEnd] = useState(() => {
        const proposed = Math.min(
            duration || MAX_CLIP_DURATION_SEC,
            currentTime + 10
        );
        return Math.max(
            Math.floor(proposed * 10) / 10,
            MIN_CLIP_DURATION_SEC
        );
    });
    const [error, setError] = useState("");
    const [status, setStatus] = useState("idle");
    const [progress, setProgress] = useState(0);
    const abortRef = useRef(null);

    useEffect(() => {
        return () => {
            abortRef.current?.abort();
        };
    }, []);

    const clipDuration = useMemo(() => {
        const s = Number(start);
        const e = Number(end);
        if (!Number.isFinite(s) || !Number.isFinite(e)) return 0;
        return Math.max(0, e - s);
    }, [start, end]);

    const validate = () => {
        const s = Number(start);
        const e = Number(end);

        if (!Number.isFinite(s) || !Number.isFinite(e)) {
            return "Start and end times must be valid numbers";
        }
        if (s < 0 || e < 0) {
            return "Times cannot be negative";
        }
        if (s >= e) {
            return "Start time must be before end time";
        }
        if (duration > 0 && (s > duration || e > duration + 0.25)) {
            return "Clip times must be within the video duration";
        }
        const length = e - s;
        if (length < MIN_CLIP_DURATION_SEC) {
            return `Clip must be at least ${MIN_CLIP_DURATION_SEC} second(s)`;
        }
        if (length > MAX_CLIP_DURATION_SEC) {
            return `Clip cannot exceed ${MAX_CLIP_DURATION_SEC} seconds`;
        }
        return "";
    };

    const handleDownload = async () => {
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }
        if (!videoId) {
            setError("Video is not available");
            return;
        }

        setError("");
        setStatus("downloading");
        setProgress(0);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const response = await axiosInstance.post(
                `/video/v/${videoId}/clip`,
                { start: Number(start), end: Number(end) },
                {
                    responseType: "blob",
                    signal: controller.signal,
                    onDownloadProgress: (event) => {
                        if (!event.total) return;
                        setProgress(
                            Math.min(
                                100,
                                Math.round((event.loaded / event.total) * 100)
                            )
                        );
                    },
                }
            );

            const blob = response.data;
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const startLabel = Math.floor(Number(start));
            const endLabel = Math.floor(Number(end));
            link.href = objectUrl;
            link.download = `clip-${startLabel}-${endLabel}.mp4`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(objectUrl);

            setProgress(100);
            setStatus("done");
        } catch (err) {
            if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") {
                setStatus("idle");
                setProgress(0);
                return;
            }
            const message = await readBlobError(
                err,
                "Failed to download clip"
            );
            setError(message);
            setStatus("error");
            setProgress(0);
        } finally {
            abortRef.current = null;
        }
    };

    const handleCancelDownload = () => {
        abortRef.current?.abort();
        setStatus("idle");
        setProgress(0);
    };

    const downloading = status === "downloading";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="download-clip-title"
                className="w-full max-w-md bg-black border border-slate-700 rounded-xl text-white p-4 sm:p-5 space-y-4"
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2
                            id="download-clip-title"
                            className="text-lg font-semibold"
                        >
                            Download Clip
                        </h2>
                        <p className="text-xs text-slate-400 mt-1">
                            Select a segment up to {MAX_CLIP_DURATION_SEC}s
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="hover:text-purple-400 p-1"
                        aria-label="Close"
                        disabled={downloading}
                    >
                        <IoCloseCircleOutline size={26} />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1 text-sm">
                        <span className="text-slate-300">Start (seconds)</span>
                        <input
                            type="number"
                            min={0}
                            step={0.1}
                            value={start}
                            disabled={downloading}
                            onChange={(e) => setStart(e.target.value)}
                            className="bg-[#222222] border border-slate-600 rounded px-2 py-1.5 outline-none focus:border-purple-500"
                        />
                        <span className="text-xs text-slate-400">
                            {formatTime(Number(start))}
                        </span>
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                        <span className="text-slate-300">End (seconds)</span>
                        <input
                            type="number"
                            min={0}
                            step={0.1}
                            value={end}
                            disabled={downloading}
                            onChange={(e) => setEnd(e.target.value)}
                            className="bg-[#222222] border border-slate-600 rounded px-2 py-1.5 outline-none focus:border-purple-500"
                        />
                        <span className="text-xs text-slate-400">
                            {formatTime(Number(end))}
                        </span>
                    </label>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        disabled={downloading}
                        onClick={() =>
                            setStart(Math.max(0, Math.floor(currentTime * 10) / 10))
                        }
                        className="text-xs sm:text-sm px-2 py-1 border border-slate-600 rounded hover:bg-purple-500 disabled:opacity-50"
                    >
                        Use current as start
                    </button>
                    <button
                        type="button"
                        disabled={downloading}
                        onClick={() =>
                            setEnd(
                                Math.max(
                                    MIN_CLIP_DURATION_SEC,
                                    Math.floor(currentTime * 10) / 10
                                )
                            )
                        }
                        className="text-xs sm:text-sm px-2 py-1 border border-slate-600 rounded hover:bg-purple-500 disabled:opacity-50"
                    >
                        Use current as end
                    </button>
                </div>

                <p className="text-sm text-slate-300">
                    Clip duration:{" "}
                    <span className="text-white font-medium">
                        {formatTime(clipDuration)} ({clipDuration.toFixed(1)}s)
                    </span>
                    {duration > 0 && (
                        <span className="text-slate-500">
                            {" "}
                            / video {formatTime(duration)}
                        </span>
                    )}
                </p>

                {error && (
                    <p className="text-sm text-red-400" role="alert">
                        {error}
                    </p>
                )}

                {downloading && (
                    <div className="space-y-1">
                        <div className="h-2 w-full bg-[#222222] rounded overflow-hidden">
                            <div
                                className="h-full bg-purple-500 transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-400">
                            Downloading… {progress > 0 ? `${progress}%` : "starting"}
                        </p>
                    </div>
                )}

                {status === "done" && (
                    <p className="text-sm text-green-400">
                        Clip downloaded successfully.
                    </p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                    {downloading ? (
                        <button
                            type="button"
                            onClick={handleCancelDownload}
                            className="bg-[#222222] py-1.5 px-3 rounded-lg text-sm hover:bg-black"
                        >
                            Cancel
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-[#222222] py-1.5 px-3 rounded-lg text-sm hover:bg-black"
                        >
                            Close
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleDownload}
                        disabled={downloading || !videoId}
                        className="bg-purple-600 py-1.5 px-3 rounded-lg text-sm hover:opacity-80 disabled:opacity-50"
                    >
                        Download Clip
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DownloadClipModal;
