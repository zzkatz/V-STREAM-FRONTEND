import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Container, Button, Spinner } from "../components";
import { fetchLiveQuota, fetchLiveStreams } from "../store/Slices/liveSlice";

function formatSec(sec) {
    if (!Number.isFinite(sec)) return "--:--";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
}

function LiveHome() {
    const dispatch = useDispatch();
    const { streams, loading, quota, quotaLoading } = useSelector(
        (state) => state.live
    );
    const hasActiveStream = Boolean(quota?.hasActiveStream);

    useEffect(() => {
        dispatch(fetchLiveStreams());
        dispatch(fetchLiveQuota());
        const id = setInterval(() => dispatch(fetchLiveQuota()), 30000);
        return () => clearInterval(id);
    }, [dispatch]);

    return (
        <Container>
            <div className="text-white py-6 px-3 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Live</h1>
                        <p className="text-sm text-slate-400 mt-1">
                            {quotaLoading && !quota ? (
                                <span className="inline-flex align-middle">
                                    <Spinner width={4} />
                                </span>
                            ) : (
                                <>
                                    Used{" "}
                                    <span className="text-white">
                                        {formatSec(quota?.usedSec ?? 0)}
                                    </span>
                                    {" · Remaining "}
                                    <span className="text-white">
                                        {formatSec(quota?.remainingSec)}
                                    </span>
                                    {" of "}
                                    {formatSec(quota?.dailyQuotaSec || 900)}
                                    {" today (UTC)"}
                                </>
                            )}
                        </p>
                    </div>
                    {hasActiveStream ? (
                        <Link to={`/live/${quota.activeStreamId}`}>
                            <Button className="bg-red-600 hover:bg-red-500 px-4 py-2">
                                Return to Live
                            </Button>
                        </Link>
                    ) : (
                        <Link to="/go-live">
                            <Button className="bg-purple-600 hover:bg-purple-500 px-4 py-2">
                                Go Live
                            </Button>
                        </Link>
                    )}
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <Spinner width={12} />
                    </div>
                ) : streams?.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {streams.map((stream) => (
                            <Link
                                key={stream.streamId}
                                to={`/live/${stream.streamId}`}
                                className="border border-slate-700 hover:border-purple-500 p-4 space-y-2 bg-[#121212]"
                            >
                                <div className="aspect-video bg-black mb-2 overflow-hidden">
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
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-red-600 text-xs font-bold px-2 py-0.5 rounded">
                                        LIVE
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {stream.viewerCount || 0} watching
                                    </span>
                                </div>
                                <h2 className="font-medium line-clamp-2">
                                    {stream.title}
                                </h2>
                                <p className="text-sm text-slate-400 truncate">
                                    {stream.broadcaster?.username || "Unknown"}
                                </p>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 text-slate-400 space-y-3">
                        <p>No public live streams right now.</p>
                        {!hasActiveStream && (
                            <Link
                                to="/go-live"
                                className="text-purple-400 underline"
                            >
                                Be the first to go live
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </Container>
    );
}

export default LiveHome;
