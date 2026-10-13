import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { getLikedVideos } from "../store/Slices/likeSlice";
import HomeSkeleton from "../skeleton/HomeSkeleton";
import { Container, NoVideosFound, VideoList } from "../components";
import { makeVideosNull } from "../store/Slices/videoSlice";
import { matchesQuery } from "../helpers/matchesQuery";

function LikedVideos() {
    const dispatch = useDispatch();
    const likedVideos = useSelector((state) => state.like?.likedVideos);
    const loading = useSelector((state) => state.like.loading);
    const [searchParams] = useSearchParams();
    const q = searchParams.get("q") || "";

    useEffect(() => {
        dispatch(getLikedVideos());

        return () => dispatch(makeVideosNull());
    }, [dispatch]);

    const filteredVideos = useMemo(() => {
        if (!likedVideos?.length) return [];
        return likedVideos.filter((item) =>
            matchesQuery(item?.likedVideo, q)
        );
    }, [likedVideos, q]);

    if (loading) {
        return <HomeSkeleton />;
    }

    if (!likedVideos?.length) {
        return <NoVideosFound />;
    }

    if (filteredVideos.length === 0) {
        return (
            <NoVideosFound text={"No liked videos match your search"} />
        );
    }

    return (
        <Container>
            <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 text-white mb-20 sm:mb-0">
                {filteredVideos.map((video) => (
                    <VideoList
                        key={video.likedVideo._id}
                        avatar={video.likedVideo.ownerDetails?.avatar?.url}
                        duration={video.likedVideo.duration}
                        title={video.likedVideo.title}
                        thumbnail={video.likedVideo.thumbnail?.url}
                        createdAt={video.likedVideo.createdAt}
                        views={video.likedVideo.views}
                        channelName={
                            video.likedVideo.ownerDetails?.username
                        }
                        videoId={video.likedVideo._id}
                    />
                ))}
            </div>
        </Container>
    );
}

export default LikedVideos;
