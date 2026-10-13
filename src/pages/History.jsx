import React, { useEffect, useMemo } from "react";
import { Container, NoVideosFound, VideoList } from "../components";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { getWatchHistory } from "../store/Slices/userSlice";
import HomeSkeleton from "../skeleton/HomeSkeleton";
import { matchesQuery } from "../helpers/matchesQuery";

function History() {
    const loading = useSelector((state) => state.user?.loading);
    const videos = useSelector((state) => state.user?.history);
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const q = searchParams.get("q") || "";

    useEffect(() => {
        dispatch(getWatchHistory());
    }, [dispatch]);

    const filteredVideos = useMemo(() => {
        if (!videos?.length) return [];
        return videos.filter((video) => matchesQuery(video, q));
    }, [videos, q]);

    if (loading) {
        return <HomeSkeleton />;
    }

    if (!videos?.length) {
        return <NoVideosFound />;
    }

    if (filteredVideos.length === 0) {
        return <NoVideosFound text={"No history videos match your search"} />;
    }

    return (
        <Container>
            <div className="grid mb-20 sm:mb-0 lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 text-white">
                {filteredVideos.map((video) => (
                    <VideoList
                        key={video._id}
                        avatar={video.owner?.avatar.url}
                        duration={video.duration}
                        title={video.title}
                        thumbnail={video.thumbnail?.url}
                        createdAt={video.createdAt}
                        views={video.views}
                        channelName={video.owner.username}
                        videoId={video._id}
                    />
                ))}
            </div>
        </Container>
    );
}

export default History;
