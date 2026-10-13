import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { BiSolidLike, BiSolidDislike } from "../components/icons";
import {
    toggleCommentLike,
    toggleCommentDislike,
    toggleTweetLike,
    toggleTweetDislike,
    toggleVideoLike,
    toggleVideoDislike,
} from "../store/Slices/likeSlice";

function Like({
    isLiked,
    isDisliked = false,
    likesCount = 0,
    dislikesCount = 0,
    tweetId,
    commentId,
    videoId,
    size,
}) {
    const dispatch = useDispatch();
    const [localIsLiked, setLocalIsLiked] = useState(isLiked);
    const [localIsDisliked, setLocalIsDisliked] = useState(isDisliked);
    const [localLikesCount, setLocalLikesCount] = useState(likesCount);
    const [localDislikesCount, setLocalDislikesCount] = useState(dislikesCount);

    const handleLikeToggle = () => {
        if (localIsLiked) {
            setLocalLikesCount((prev) => Math.max(prev - 1, 0));
            setLocalIsLiked(false);
        } else {
            setLocalLikesCount((prev) => prev + 1);
            setLocalIsLiked(true);
            if (localIsDisliked) {
                setLocalIsDisliked(false);
                setLocalDislikesCount((prev) => Math.max(prev - 1, 0));
            }
        }

        if (tweetId) dispatch(toggleTweetLike(tweetId));
        if (commentId) dispatch(toggleCommentLike(commentId));
        if (videoId) dispatch(toggleVideoLike(videoId));
    };

    const handleDislikeToggle = () => {
        if (localIsDisliked) {
            setLocalDislikesCount((prev) => Math.max(prev - 1, 0));
            setLocalIsDisliked(false);
        } else {
            setLocalDislikesCount((prev) => prev + 1);
            setLocalIsDisliked(true);
            if (localIsLiked) {
                setLocalIsLiked(false);
                setLocalLikesCount((prev) => Math.max(prev - 1, 0));
            }
        }

        if (tweetId) dispatch(toggleTweetDislike(tweetId));
        if (commentId) dispatch(toggleCommentDislike(commentId));
        if (videoId) dispatch(toggleVideoDislike(videoId));
    };

    useEffect(() => {
        setLocalIsLiked(isLiked);
        setLocalIsDisliked(isDisliked);
        setLocalLikesCount(likesCount);
        setLocalDislikesCount(dislikesCount);
    }, [isLiked, isDisliked, likesCount, dislikesCount]);

    return (
        <div className="flex items-center gap-1">
            <BiSolidLike
                size={size}
                onClick={handleLikeToggle}
                className={`cursor-pointer ${
                    localIsLiked ? "text-purple-500" : ""
                }`}
            />
            <span className="text-xs mr-3">{localLikesCount}</span>
            <BiSolidDislike
                size={size}
                onClick={handleDislikeToggle}
                className={`cursor-pointer ${
                    localIsDisliked ? "text-purple-500" : ""
                }`}
            />
            <span className="text-xs">{localDislikesCount}</span>
        </div>
    );
}

export default Like;
