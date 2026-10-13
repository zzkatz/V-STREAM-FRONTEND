import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Spinner } from "../../components";
import { fetchChannelLiveStreams } from "../../store/Slices/liveSlice";

function formatDuration(sec) {
    if (!Number.isFinite(sec) || sec <= 0) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
}

function ChannelLive() {
    const { username } = useParams();
    const dispatch = useDispatch();
    const { channelStreams, loading } = useSelector((state) => state.live);

    useEffect(() => {
        if (username) dispatch(fetchChannelLiveStreams(username));
    }, [dispatch, username]);

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Spinner width={12} />
            </div>
        );
    }

    if (!channelStreams?.length) {
        return (
            <div className="text-center text-slate-400 py-16">
                No livestreams yet.
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-3">
            {channelStreams.map((stream) => {
                const isLive = stream.status === "live";
                const hasReplay = stream.recording?.status === "ready";
                const clickable = isLive || hasReplay;

                const card = (
                    <div className="border border-slate-700 hover:border-purple-500 p-3 space-y-2 bg-[#121212] h-full">
                        <div className="aspect-video bg-black overflow-hidden relative">
                            {stream.thumbnail?.url ? (
                                <img
                                    src={stream.thumbnail.url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                                    No thumbnail
                                </div>
                            )}
                            {isLive && (
                                <span className="absolute top-2 left-2 bg-red-600 text-xs font-bold px-2 py-0.5 rounded">
                                    LIVE
                                </span>
                            )}
                            {!isLive && hasReplay && (
                                <span className="absolute top-2 left-2 bg-purple-600 text-xs font-bold px-2 py-0.5 rounded">
                                    Replay
                                </span>
                            )}
                        </div>
                        <h3 className="text-white font-medium line-clamp-2">
                            {stream.title}
                        </h3>
                        <p className="text-xs text-slate-400">
                            {isLive
                                ? `${stream.viewerCount || 0} watching`
                                : hasReplay
                                  ? `Ended · ${formatDuration(
                                        stream.recording?.durationSec ||
                                            stream.durationSec
                                    )}`
                                  : stream.recording?.status === "processing"
                                    ? "Processing recording…"
                                    : `Ended · no recording`}
                        </p>
                    </div>
                );

                return clickable ? (
                    <Link key={stream.streamId} to={`/live/${stream.streamId}`}>
                        {card}
                    </Link>
                ) : (
                    <div key={stream.streamId}>{card}</div>
                );
            })}
        </div>
    );
}

export default ChannelLive;
