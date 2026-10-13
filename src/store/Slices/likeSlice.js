import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../helpers/axiosInstance";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../helpers/getErrorMessage";

const initialState = {
    loading: false,
    likedVideos: [],
};

export const toggleVideoLike = createAsyncThunk(
    "toggleVideoLike",
    async (videoId) => {
        try {
            const response = await axiosInstance.post(
                `/likes/toggle/v/${videoId}`
            );
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error));
            throw error;
        }
    }
);

export const toggleVideoDislike = createAsyncThunk(
    "toggleVideoDislike",
    async (videoId) => {
        try {
            const response = await axiosInstance.post(
                `/likes/toggle/dislike/v/${videoId}`
            );
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error));
            throw error;
        }
    }
);

export const toggleTweetLike = createAsyncThunk(
    "toggleTweetLike",
    async (tweetId) => {
        try {
            const response = await axiosInstance.post(
                `/likes/toggle/t/${tweetId}`
            );
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error));
            throw error;
        }
    }
);

export const toggleTweetDislike = createAsyncThunk(
    "toggleTweetDislike",
    async (tweetId) => {
        try {
            const response = await axiosInstance.post(
                `/likes/toggle/dislike/t/${tweetId}`
            );
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error));
            throw error;
        }
    }
);

export const toggleCommentLike = createAsyncThunk(
    "toggleCommentLike",
    async (commentId) => {
        try {
            const response = await axiosInstance.post(
                `/likes/toggle/c/${commentId}`
            );
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error));
            throw error;
        }
    }
);

export const toggleCommentDislike = createAsyncThunk(
    "toggleCommentDislike",
    async (commentId) => {
        try {
            const response = await axiosInstance.post(
                `/likes/toggle/dislike/c/${commentId}`
            );
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error));
            throw error;
        }
    }
);

export const getLikedVideos = createAsyncThunk("getLikedVideos", async () => {
    try {
        const response = await axiosInstance.get("likes/videos");
        return response.data.data;
    } catch (error) {
        toast.error(getErrorMessage(error));
        throw error;
    }
});

const likeSlice = createSlice({
    name: "like",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(getLikedVideos.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getLikedVideos.fulfilled, (state, action) => {
            state.loading = false;
            state.likedVideos = action.payload;
        });
        builder.addCase(getLikedVideos.rejected, (state) => {
            state.loading = false;
        });
    },
});

export default likeSlice.reducer;
