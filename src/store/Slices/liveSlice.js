import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../helpers/axiosInstance";
import toast from "react-hot-toast";
import { getErrorMessage } from "../../helpers/getErrorMessage";

const initialState = {
    loading: false,
    quotaLoading: false,
    streams: [],
    myStreams: [],
    channelStreams: [],
    currentStream: null,
    tokenPayload: null,
    quota: null,
    error: null,
};

export const fetchLiveQuota = createAsyncThunk(
    "live/fetchQuota",
    async () => {
        try {
            const response = await axiosInstance.get("/live/quota");
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to fetch live quota"));
            throw error;
        }
    }
);

export const fetchLiveStreams = createAsyncThunk(
    "live/fetchStreams",
    async () => {
        try {
            const response = await axiosInstance.get("/live/streams");
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to fetch live streams"));
            throw error;
        }
    }
);

export const fetchMyLiveStreams = createAsyncThunk(
    "live/fetchMyStreams",
    async () => {
        try {
            const response = await axiosInstance.get("/live/streams/mine");
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to fetch your livestreams"));
            throw error;
        }
    }
);

export const fetchChannelLiveStreams = createAsyncThunk(
    "live/fetchChannelStreams",
    async (username) => {
        try {
            const response = await axiosInstance.get(
                `/live/streams/by/${username}`
            );
            return response.data.data;
        } catch (error) {
            toast.error(
                getErrorMessage(error, "Failed to fetch channel livestreams")
            );
            throw error;
        }
    }
);

export const fetchLiveStream = createAsyncThunk(
    "live/fetchStream",
    async (streamId) => {
        try {
            const response = await axiosInstance.get(`/live/streams/${streamId}`);
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to fetch stream"));
            throw error;
        }
    }
);

export const createLiveStream = createAsyncThunk(
    "live/createStream",
    async ({ title, description, visibility }) => {
        try {
            const response = await axiosInstance.post("/live/streams", {
                title,
                description,
                visibility,
            });
            toast.success(response.data?.message || "Live stream created");
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to create stream"));
            throw error;
        }
    }
);

export const updateLiveStream = createAsyncThunk(
    "live/updateStream",
    async ({ streamId, data }) => {
        try {
            const formData = new FormData();
            if (data.title !== undefined) formData.append("title", data.title);
            if (data.description !== undefined) {
                formData.append("description", data.description);
            }
            if (data.thumbnail) formData.append("thumbnail", data.thumbnail);

            const response = await axiosInstance.patch(
                `/live/streams/${streamId}`,
                formData
            );
            toast.success(response.data?.message || "Stream updated");
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to update stream"));
            throw error;
        }
    }
);

export const getLiveToken = createAsyncThunk(
    "live/getToken",
    async ({ streamId, role }) => {
        try {
            const response = await axiosInstance.post(
                `/live/streams/${streamId}/token`,
                { role }
            );
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to join stream"));
            throw error;
        }
    }
);

export const endLiveStream = createAsyncThunk(
    "live/endStream",
    async (streamId) => {
        try {
            const response = await axiosInstance.post(
                `/live/streams/${streamId}/end`
            );
            toast.success(response.data?.message || "Stream ended");
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to end stream"));
            throw error;
        }
    }
);

export const checkpointLiveStream = createAsyncThunk(
    "live/checkpoint",
    async (streamId) => {
        try {
            const response = await axiosInstance.post(
                `/live/streams/${streamId}/checkpoint`
            );
            return response.data.data;
        } catch (error) {
            throw error;
        }
    }
);

export const deleteLiveStream = createAsyncThunk(
    "live/deleteStream",
    async (streamId) => {
        try {
            const response = await axiosInstance.delete(
                `/live/streams/${streamId}`
            );
            toast.success(response.data?.message || "Livestream deleted");
            return { streamId, ...(response.data.data || {}) };
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to delete livestream"));
            throw error;
        }
    }
);

export const uploadLiveRecording = createAsyncThunk(
    "live/uploadRecording",
    async ({ streamId, file }, { rejectWithValue }) => {
        try {
            const formData = new FormData();
            const filename =
                file instanceof File
                    ? file.name
                    : `live-${streamId}.webm`;
            formData.append("recording", file, filename);
            const response = await axiosInstance.post(
                `/live/streams/${streamId}/recording`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            toast.success(response.data?.message || "Recording saved");
            return response.data.data;
        } catch (error) {
            toast.error(getErrorMessage(error, "Failed to save recording"));
            return rejectWithValue(
                getErrorMessage(error, "Failed to save recording")
            );
        }
    }
);

const liveSlice = createSlice({
    name: "live",
    initialState,
    reducers: {
        clearLiveState: (state) => {
            state.currentStream = null;
            state.tokenPayload = null;
            state.error = null;
        },
        setQuota: (state, action) => {
            state.quota = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLiveQuota.pending, (state) => {
                state.quotaLoading = true;
            })
            .addCase(fetchLiveQuota.fulfilled, (state, action) => {
                state.quotaLoading = false;
                state.quota = action.payload;
            })
            .addCase(fetchLiveQuota.rejected, (state) => {
                state.quotaLoading = false;
            })
            .addCase(fetchLiveStreams.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchLiveStreams.fulfilled, (state, action) => {
                state.loading = false;
                state.streams = action.payload || [];
            })
            .addCase(fetchLiveStreams.rejected, (state) => {
                state.loading = false;
            })
            .addCase(fetchMyLiveStreams.fulfilled, (state, action) => {
                state.myStreams = action.payload || [];
            })
            .addCase(fetchChannelLiveStreams.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchChannelLiveStreams.fulfilled, (state, action) => {
                state.loading = false;
                state.channelStreams = action.payload || [];
            })
            .addCase(fetchChannelLiveStreams.rejected, (state) => {
                state.loading = false;
            })
            .addCase(fetchLiveStream.fulfilled, (state, action) => {
                state.currentStream = action.payload;
            })
            .addCase(createLiveStream.fulfilled, (state, action) => {
                state.currentStream = action.payload;
                state.quota = {
                    ...(state.quota || {}),
                    remainingSec: action.payload.remainingSec,
                    usedSec: action.payload.usedSec,
                    finalizedUsedSec: action.payload.finalizedUsedSec,
                    activeSessionSec: action.payload.activeSessionSec,
                    dailyQuotaSec: action.payload.dailyQuotaSec,
                    hasActiveStream: true,
                    activeStreamId: action.payload.streamId,
                };
            })
            .addCase(updateLiveStream.fulfilled, (state, action) => {
                const updated = action.payload;
                state.myStreams = state.myStreams.map((s) =>
                    s.streamId === updated.streamId ? updated : s
                );
                state.channelStreams = state.channelStreams.map((s) =>
                    s.streamId === updated.streamId ? updated : s
                );
                if (state.currentStream?.streamId === updated.streamId) {
                    state.currentStream = updated;
                }
            })
            .addCase(getLiveToken.fulfilled, (state, action) => {
                state.tokenPayload = action.payload;
                if (typeof action.payload.remainingSec === "number") {
                    state.quota = {
                        ...(state.quota || {}),
                        remainingSec: action.payload.remainingSec,
                        ...(typeof action.payload.usedSec === "number"
                            ? { usedSec: action.payload.usedSec }
                            : {}),
                        ...(typeof action.payload.finalizedUsedSec === "number"
                            ? {
                                  finalizedUsedSec:
                                      action.payload.finalizedUsedSec,
                              }
                            : {}),
                        ...(typeof action.payload.activeSessionSec === "number"
                            ? {
                                  activeSessionSec:
                                      action.payload.activeSessionSec,
                              }
                            : {}),
                        ...(typeof action.payload.dailyQuotaSec === "number"
                            ? { dailyQuotaSec: action.payload.dailyQuotaSec }
                            : {}),
                    };
                }
            })
            .addCase(endLiveStream.fulfilled, (state, action) => {
                state.currentStream = action.payload;
                state.tokenPayload = null;
                state.quota = {
                    ...(state.quota || {}),
                    remainingSec: action.payload.remainingSec,
                    usedSec: action.payload.usedSec,
                    finalizedUsedSec: action.payload.finalizedUsedSec,
                    activeSessionSec: action.payload.activeSessionSec ?? 0,
                    dailyQuotaSec: action.payload.dailyQuotaSec,
                    hasActiveStream: false,
                    activeStreamId: null,
                };
            })
            .addCase(checkpointLiveStream.fulfilled, (state, action) => {
                if (typeof action.payload.remainingSec === "number") {
                    state.quota = {
                        ...(state.quota || {}),
                        remainingSec: action.payload.remainingSec,
                        ...(typeof action.payload.usedSec === "number"
                            ? { usedSec: action.payload.usedSec }
                            : {}),
                        ...(typeof action.payload.finalizedUsedSec === "number"
                            ? {
                                  finalizedUsedSec:
                                      action.payload.finalizedUsedSec,
                              }
                            : {}),
                        ...(typeof action.payload.activeSessionSec === "number"
                            ? {
                                  activeSessionSec:
                                      action.payload.activeSessionSec,
                              }
                            : {}),
                        ...(typeof action.payload.dailyQuotaSec === "number"
                            ? { dailyQuotaSec: action.payload.dailyQuotaSec }
                            : {}),
                    };
                }
            })
            .addCase(uploadLiveRecording.fulfilled, (state, action) => {
                state.currentStream = action.payload;
                state.myStreams = state.myStreams.map((s) =>
                    s.streamId === action.payload.streamId
                        ? action.payload
                        : s
                );
                state.channelStreams = state.channelStreams.map((s) =>
                    s.streamId === action.payload.streamId
                        ? action.payload
                        : s
                );
            })
            .addCase(deleteLiveStream.fulfilled, (state, action) => {
                const id = action.payload.streamId;
                state.myStreams = state.myStreams.filter(
                    (s) => s.streamId !== id
                );
                state.channelStreams = state.channelStreams.filter(
                    (s) => s.streamId !== id
                );
                if (state.currentStream?.streamId === id) {
                    state.currentStream = null;
                    state.tokenPayload = null;
                }
                if (state.quota?.activeStreamId === id) {
                    state.quota = {
                        ...state.quota,
                        hasActiveStream: false,
                        activeStreamId: null,
                    };
                }
            });
    },
});

export const { clearLiveState, setQuota } = liveSlice.actions;
export default liveSlice.reducer;
