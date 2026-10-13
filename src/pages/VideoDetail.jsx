import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { getVideoById } from "../store/Slices/videoSlice";
import {
    CommentList,
    TweetAndComment,
    Video,
    Description,
    Spinner,
    InfiniteScroll,
    RecommendationsPlaceholder,
} from "../components";
import {
    cleanUpComments,
    getVideoComments,
} from "../store/Slices/commentSlice";

function VideoDetail() {
    const dispatch = useDispatch();
    const { videoId } = useParams();
    const video = useSelector((state) => state.video?.video);
    const comments = useSelector((state) => state.comment?.comments);
    const totalComments = useSelector((state) => state.comment?.totalComments);
    const hasNextPage = useSelector((state) => state.comment?.hasNextPage);
    const loading = useSelector((state) => state.comment?.loading);
    const [page, setPage] = useState(1);

    useEffect(() => {
        if (videoId) {
            dispatch(getVideoById({ videoId }));
            dispatch(getVideoComments({ videoId }));
        }

        return () => dispatch(cleanUpComments());
    }, [dispatch, videoId]);

    const fetchMoreComments = useCallback(() => {
        if (!loading && hasNextPage) {
            dispatch(getVideoComments({ videoId, page: page + 1 }));
            setPage((prev) => prev + 1);
        }
    }, [page, loading, hasNextPage, dispatch, videoId]);

    return (
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 pb-8">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] gap-4 lg:gap-6 items-start">
                <div className="order-1 min-w-0 w-full space-y-3">
                    <Video
                        src={video?.videoFile?.url}
                        poster={video?.thumbnail?.url}
                        title={video?.title}
                        videoId={video?._id}
                    />
                    <Description
                        avatar={video?.owner?.avatar.url}
                        channelName={video?.owner?.username}
                        createdAt={video?.createdAt}
                        description={video?.description}
                        isSubscribed={video?.owner?.isSubscribed}
                        likesCount={video?.likesCount}
                        dislikesCount={video?.dislikesCount}
                        subscribersCount={video?.owner?.subscribersCount}
                        title={video?.title}
                        views={video?.views}
                        key={video?._id}
                        isLiked={video?.isLiked}
                        isDisliked={video?.isDisliked}
                        videoId={video?._id}
                        channelId={video?.owner?._id}
                    />
                </div>

                <div className="order-2 lg:col-start-2 lg:row-span-2 lg:row-start-1 self-start min-w-0 w-full">
                    <RecommendationsPlaceholder />
                </div>

                <div className="order-3 lg:col-start-1 min-w-0 w-full space-y-2">
                    <div className="text-white font-semibold px-0">
                        {totalComments} Comments
                    </div>
                    <TweetAndComment
                        comment={true}
                        videoId={video?._id}
                    />
                    <InfiniteScroll
                        fetchMore={fetchMoreComments}
                        hasNextPage={hasNextPage}
                    >
                        <div className="w-full">
                            {comments?.map((comment) => (
                                <CommentList
                                    key={comment?._id}
                                    avatar={comment?.owner?.avatar?.url}
                                    commentId={comment?._id}
                                    content={comment?.content}
                                    createdAt={comment?.createdAt}
                                    fullName={comment?.owner?.fullName}
                                    isLiked={comment?.isLiked}
                                    isDisliked={comment?.isDisliked}
                                    likesCount={comment?.likesCount}
                                    dislikesCount={comment?.dislikesCount}
                                    username={comment?.owner?.username}
                                />
                            ))}
                            {loading && (
                                <div className="w-full flex justify-center items-center">
                                    <Spinner width={10} />
                                </div>
                            )}
                        </div>
                    </InfiniteScroll>
                </div>
            </div>
        </div>
    );
}

export default VideoDetail;
