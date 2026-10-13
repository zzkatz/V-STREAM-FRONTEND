import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../helpers/axiosInstance";
import toast from "react-hot-toast";
import { BASE_URL } from "../../constants";
import { getErrorMessage } from "../../helpers/getErrorMessage";

const initialState = {
    loading: false,
    comments: [],
    totalComments: null,
    hasNextPage: false,
};

export const createAComment = createAsyncThunk(
    "createAComment",
    async ({ videoId, content }) => {
        try {
            const response = await axiosInstance.post(`/comment/${videoId}`, {
                content,
            });
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to create comment"));
            throw error;
        }
    }
);

export const editAComment = createAsyncThunk(
    "editAComment",
    async ({ commentId, content }) => {
        try {
            const response = await axiosInstance.patch(
                `/comment/c/${commentId}`,
                { content }
            );
            toast.success(response.data?.message);
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to edit comment"));
            throw error;
        }
    }
);

export const deleteAComment = createAsyncThunk(
    "deleteAComment",
    async (commentId) => {
        try {
            const response = await axiosInstance.delete(
                `/comment/c/${commentId}`
            );
            toast.success(response.data.message);
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to delete comment"));
            throw error;
        }
    }
);

export const getVideoComments = createAsyncThunk(
    "getVideoComments",
    async ({ videoId, page, limit }) => {
        const url = new URL(`${BASE_URL}/comment/${videoId}`);
        if (page) url.searchParams.set("page", page);
        if (limit) url.searchParams.set("limit", limit);

        try {
            const response = await axiosInstance.get(url);
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to fetch comments"));
            throw error;
        }
    }
);

const commentSlice = createSlice({
    name: "comment",
    initialState,
    reducers: {
        cleanUpComments: (state) => {
            state.comments = [];
        },
    },
    extraReducers: (builder) => {
        builder.addCase(getVideoComments.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(getVideoComments.fulfilled, (state, action) => {
            state.loading = false;
            state.comments = [...state.comments, ...(action.payload.docs || [])];
            state.totalComments = action.payload.totalDocs;
            state.hasNextPage = action.payload.hasNextPage;
        });
        builder.addCase(getVideoComments.rejected, (state) => {
            state.loading = false;
        });
        builder.addCase(createAComment.fulfilled, (state, action) => {
            state.comments.unshift(action.payload);
            state.totalComments = (state.totalComments || 0) + 1;
        });
        builder.addCase(deleteAComment.fulfilled, (state, action) => {
            state.comments = state.comments.filter(
                (comment) => comment._id !== action.payload.commentId
            );
            state.totalComments = Math.max(0, (state.totalComments || 1) - 1);
        });
    },
});

export const { cleanUpComments } = commentSlice.actions;

export default commentSlice.reducer;
