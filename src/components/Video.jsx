import React, { useCallback, useEffect, useRef, useState } from "react";
import Spinner from "./Spinner";
import DownloadClipModal from "./DownloadClipModal";
import {
    FaPlay,
    FaPause,
    FaVolumeUp,
    FaVolumeMute,
    FaExpand,
    FaCompress,
    FaDownload,
    MdReplay10,
    MdForward10,
    MdSpeed,
} from "./icons";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const HIDE_CONTROLS_MS = 3000;

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

function Video({ src, poster, title, videoId, className = "" }) {
    const containerRef = useRef(null);
    const videoRef = useRef(null);
    const hideTimerRef = useRef(null);

    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [muted, setMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [buffering, setBuffering] = useState(false);
    const [error, setError] = useState(null);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [fullscreen, setFullscreen] = useState(false);
    const [speedOpen, setSpeedOpen] = useState(false);
    const [clipOpen, setClipOpen] = useState(false);

    const clearHideTimer = useCallback(() => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, []);

    const scheduleHideControls = useCallback(() => {
        clearHideTimer();
        const video = videoRef.current;
        if (!video || video.paused || error) {
            setControlsVisible(true);
            return;
        }
        hideTimerRef.current = setTimeout(() => {
            setControlsVisible(false);
            setSpeedOpen(false);
        }, HIDE_CONTROLS_MS);
    }, [clearHideTimer, error]);

    const showControls = useCallback(() => {
        setControlsVisible(true);
        scheduleHideControls();
    }, [scheduleHideControls]);

    const togglePlay = useCallback(async () => {
        const video = videoRef.current;
        if (!video || error) return;
        try {
            if (video.paused) {
                await video.play();
            } else {
                video.pause();
            }
        } catch {
            // Autoplay or play() rejection
        }
        showControls();
    }, [error, showControls]);

    const seekBy = useCallback(
        (delta) => {
            const video = videoRef.current;
            if (!video || !Number.isFinite(video.duration)) return;
            video.currentTime = Math.min(
                Math.max(video.currentTime + delta, 0),
                video.duration
            );
            showControls();
        },
        [showControls]
    );

    const seekTo = useCallback(
        (value) => {
            const video = videoRef.current;
            if (!video) return;
            const next = Number(value);
            if (!Number.isFinite(next)) return;
            video.currentTime = next;
            setCurrentTime(next);
            showControls();
        },
        [showControls]
    );

    const toggleMute = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setMuted(video.muted);
        showControls();
    }, [showControls]);

    const changeVolume = useCallback(
        (value) => {
            const video = videoRef.current;
            if (!video) return;
            const next = Math.min(Math.max(Number(value), 0), 1);
            video.volume = next;
            video.muted = next === 0;
            setVolume(next);
            setMuted(video.muted);
            showControls();
        },
        [showControls]
    );

    const changeSpeed = useCallback(
        (rate) => {
            const video = videoRef.current;
            if (!video) return;
            video.playbackRate = rate;
            setPlaybackRate(rate);
            setSpeedOpen(false);
            showControls();
        },
        [showControls]
    );

    const toggleFullscreen = useCallback(async () => {
        const container = containerRef.current;
        if (!container) return;
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else if (container.requestFullscreen) {
                await container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            }
        } catch {
            // Fullscreen denied
        }
        showControls();
    }, [showControls]);

    const retryLoad = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        setError(null);
        setBuffering(true);
        video.load();
        video.play().catch(() => {});
        showControls();
    }, [showControls]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        setError(null);
        setCurrentTime(0);
        setDuration(0);
        setPlaying(false);
        setBuffering(true);

        const onPlay = () => {
            setPlaying(true);
            scheduleHideControls();
        };
        const onPause = () => {
            setPlaying(false);
            clearHideTimer();
            setControlsVisible(true);
        };
        const onTimeUpdate = () => setCurrentTime(video.currentTime);
        const onLoadedMetadata = () => {
            setDuration(video.duration || 0);
            setBuffering(false);
        };
        const onDurationChange = () => setDuration(video.duration || 0);
        const onWaiting = () => setBuffering(true);
        const onPlaying = () => {
            setBuffering(false);
            setPlaying(true);
        };
        const onCanPlay = () => setBuffering(false);
        const onEnded = () => {
            setPlaying(false);
            setControlsVisible(true);
            clearHideTimer();
        };
        const onError = () => {
            setBuffering(false);
            setPlaying(false);
            setError("Failed to load video. Please try again.");
            setControlsVisible(true);
        };
        const onVolumeChange = () => {
            setVolume(video.volume);
            setMuted(video.muted);
        };
        const onRateChange = () => setPlaybackRate(video.playbackRate);

        video.addEventListener("play", onPlay);
        video.addEventListener("pause", onPause);
        video.addEventListener("timeupdate", onTimeUpdate);
        video.addEventListener("loadedmetadata", onLoadedMetadata);
        video.addEventListener("durationchange", onDurationChange);
        video.addEventListener("waiting", onWaiting);
        video.addEventListener("playing", onPlaying);
        video.addEventListener("canplay", onCanPlay);
        video.addEventListener("ended", onEnded);
        video.addEventListener("error", onError);
        video.addEventListener("volumechange", onVolumeChange);
        video.addEventListener("ratechange", onRateChange);

        video.play().catch(() => {});

        return () => {
            video.removeEventListener("play", onPlay);
            video.removeEventListener("pause", onPause);
            video.removeEventListener("timeupdate", onTimeUpdate);
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("durationchange", onDurationChange);
            video.removeEventListener("waiting", onWaiting);
            video.removeEventListener("playing", onPlaying);
            video.removeEventListener("canplay", onCanPlay);
            video.removeEventListener("ended", onEnded);
            video.removeEventListener("error", onError);
            video.removeEventListener("volumechange", onVolumeChange);
            video.removeEventListener("ratechange", onRateChange);
            clearHideTimer();
        };
    }, [src, clearHideTimer, scheduleHideControls]);

    useEffect(() => {
        const onFullscreenChange = () => {
            setFullscreen(Boolean(document.fullscreenElement));
        };
        document.addEventListener("fullscreenchange", onFullscreenChange);
        return () =>
            document.removeEventListener("fullscreenchange", onFullscreenChange);
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const onKeyDown = (e) => {
            const active = document.activeElement;
            const focusedInPlayer =
                active === container || container.contains(active);
            if (!focusedInPlayer) return;

            const tag = active?.tagName;
            if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") {
                return;
            }

            if (e.code === "Space") {
                e.preventDefault();
                togglePlay();
            } else if (e.code === "ArrowLeft") {
                e.preventDefault();
                seekBy(-10);
            } else if (e.code === "ArrowRight") {
                e.preventDefault();
                seekBy(10);
            } else if (e.key === "f" || e.key === "F") {
                e.preventDefault();
                toggleFullscreen();
            }
        };

        container.addEventListener("keydown", onKeyDown);
        return () => container.removeEventListener("keydown", onKeyDown);
    }, [togglePlay, seekBy, toggleFullscreen]);

    const showBar = controlsVisible || !playing || buffering || Boolean(error);

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            className={`relative w-full bg-black outline-none group ${className}`}
            onMouseMove={showControls}
            onMouseEnter={() => containerRef.current?.focus({ preventScroll: true })}
            onMouseLeave={() => {
                if (playing && !error) scheduleHideControls();
            }}
            onTouchStart={showControls}
            onFocus={showControls}
            onClick={() => containerRef.current?.focus({ preventScroll: true })}
        >
            <div className="relative w-full aspect-video bg-black">
                <video
                    ref={videoRef}
                    src={src}
                    poster={poster}
                    controls={false}
                    playsInline
                    preload="metadata"
                    className="absolute inset-0 w-full h-full object-contain"
                    onClick={togglePlay}
                />

                {buffering && !error && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                        <Spinner width={10} />
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-white p-4 text-center">
                        <p className="text-sm sm:text-base">{error}</p>
                        <button
                            type="button"
                            onClick={retryLoad}
                            className="bg-purple-500 hover:bg-purple-600 text-black font-semibold px-4 py-2"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!playing && !buffering && !error && (
                    <button
                        type="button"
                        onClick={togglePlay}
                        className="absolute inset-0 m-auto h-14 w-14 rounded-full bg-purple-500/90 text-black flex items-center justify-center hover:bg-purple-500"
                        aria-label="Play"
                    >
                        <FaPlay size={22} className="ml-1" />
                    </button>
                )}

                <div
                    className={`absolute inset-x-0 bottom-0 transition-opacity duration-300 ${
                        showBar ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pt-8 pb-3 space-y-2">
                        {title && (
                            <p className="text-white text-xs sm:text-sm truncate px-1">
                                {title}
                            </p>
                        )}

                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            step={0.1}
                            value={currentTime}
                            onChange={(e) => seekTo(e.target.value)}
                            className="w-full h-1.5 accent-purple-500 cursor-pointer"
                            aria-label="Seek"
                        />

                        <div className="flex items-center justify-between gap-2 text-white">
                            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                                <button
                                    type="button"
                                    onClick={togglePlay}
                                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center hover:text-purple-400"
                                    aria-label={playing ? "Pause" : "Play"}
                                >
                                    {playing ? (
                                        <FaPause size={18} />
                                    ) : (
                                        <FaPlay size={18} />
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => seekBy(-10)}
                                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center hover:text-purple-400"
                                    aria-label="Rewind 10 seconds"
                                >
                                    <MdReplay10 size={20} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => seekBy(10)}
                                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center hover:text-purple-400"
                                    aria-label="Forward 10 seconds"
                                >
                                    <MdForward10 size={20} />
                                </button>

                                <span className="text-xs sm:text-sm tabular-nums whitespace-nowrap leading-none px-1">
                                    {formatTime(currentTime)} / {formatTime(duration)}
                                </span>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={toggleMute}
                                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center hover:text-purple-400"
                                        aria-label={muted ? "Unmute" : "Mute"}
                                    >
                                        {muted || volume === 0 ? (
                                            <FaVolumeMute size={18} />
                                        ) : (
                                            <FaVolumeUp size={18} />
                                        )}
                                    </button>
                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        value={muted ? 0 : volume}
                                        onChange={(e) =>
                                            changeVolume(e.target.value)
                                        }
                                        className="hidden sm:block w-20 h-1.5 accent-purple-500 cursor-pointer"
                                        aria-label="Volume"
                                    />
                                </div>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSpeedOpen((prev) => !prev);
                                            showControls();
                                        }}
                                        className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center gap-1 px-1.5 hover:text-purple-400 text-xs"
                                        aria-label="Playback speed"
                                    >
                                        <MdSpeed size={18} />
                                        <span className="leading-none">
                                            {playbackRate}x
                                        </span>
                                    </button>
                                    {speedOpen && (
                                        <div className="absolute bottom-9 right-0 bg-[#222222] border border-slate-600 py-1 min-w-[5rem] z-10">
                                            {SPEEDS.map((rate) => (
                                                <button
                                                    key={rate}
                                                    type="button"
                                                    onClick={() =>
                                                        changeSpeed(rate)
                                                    }
                                                    className={`block w-full text-left px-3 py-1 text-sm hover:bg-purple-500 ${
                                                        playbackRate === rate
                                                            ? "text-purple-400"
                                                            : "text-white"
                                                    }`}
                                                >
                                                    {rate}x
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {videoId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSpeedOpen(false);
                                            setClipOpen(true);
                                            showControls();
                                        }}
                                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center hover:text-purple-400"
                                        aria-label="Download clip"
                                        title="Download clip"
                                    >
                                        <FaDownload size={16} />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={toggleFullscreen}
                                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center hover:text-purple-400"
                                    aria-label={
                                        fullscreen
                                            ? "Exit fullscreen"
                                            : "Fullscreen"
                                    }
                                >
                                    {fullscreen ? (
                                        <FaCompress size={16} />
                                    ) : (
                                        <FaExpand size={16} />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {clipOpen && (
                <DownloadClipModal
                    videoId={videoId}
                    currentTime={currentTime}
                    duration={duration}
                    onClose={() => setClipOpen(false)}
                />
            )}
        </div>
    );
}

export default Video;
