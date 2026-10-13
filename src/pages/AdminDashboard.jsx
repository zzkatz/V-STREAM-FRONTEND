import React, { useEffect, useState } from "react";
import {
    Container,
    DeleteConfirmation,
    HeaderSection,
    Spinner,
    StatsSection,
    VideoTable,
    EditVideo,
    UploadVideo,
    EditLiveStream,
    Button,
} from "../components";
import { useDispatch, useSelector } from "react-redux";
import { getChannelStats, getChannelVideos } from "../store/Slices/dashboard";
import { deleteAVideo } from "../store/Slices/videoSlice";
import {
    deleteLiveStream,
    fetchMyLiveStreams,
} from "../store/Slices/liveSlice";
import { Link } from "react-router-dom";
import { GrEdit, ImBin } from "../components/icons";

function AdminDashboard() {
    const username = useSelector((state) => state.auth.userData?.username);
    const dashboard = useSelector((state) => state.dashboard.channelStats);
    const videos = useSelector((state) => state.dashboard.channelVideos);
    const myStreams = useSelector((state) => state.live.myStreams);
    const uploaded = useSelector((state) => state.video.uploaded);
    const publishToggled = useSelector((state) => state.video.publishToggled);
    const deleting = useSelector((state) => state.video.loading);

    const dispatch = useDispatch();
    const [videoDetails, setVideoDetails] = useState(null);
    const [liveDetails, setLiveDetails] = useState(null);
    const [deletingLive, setDeletingLive] = useState(false);
    const [popUp, setPopUp] = useState({
        uploadVideo: false,
        editVideo: false,
        deleteVideo: false,
        editLive: false,
        deleteLive: false,
    });

    const handleDeleteVideo = async () => {
        dispatch(deleteAVideo(videoDetails?._id));
        setPopUp((prev) => ({
            ...prev,
            deleteVideo: !prev.deleteVideo,
        }));
    };

    const handleDeleteLive = async () => {
        if (!liveDetails?.streamId) return;
        setDeletingLive(true);
        try {
            await dispatch(deleteLiveStream(liveDetails.streamId)).unwrap();
            setPopUp((prev) => ({ ...prev, deleteLive: false }));
            setLiveDetails(null);
            dispatch(fetchMyLiveStreams());
        } catch {
            // toast in slice
        } finally {
            setDeletingLive(false);
        }
    };

    useEffect(() => {
        dispatch(getChannelStats());
        dispatch(fetchMyLiveStreams());
    }, [dispatch]);

    useEffect(() => {
        dispatch(getChannelVideos());
    }, [dispatch, uploaded, publishToggled, deleting]);

    return (
        <Container>
            <div className="w-full relative min-h-full text-white space-y-5 z-10 py-4 px-1">
                {popUp.uploadVideo && (
                    <UploadVideo setUploadVideoPopup={setPopUp} />
                )}

                {popUp.editVideo && (
                    <div className="w-full flex justify-center top-24 fixed z-20">
                        <EditVideo
                            setEditVideoPopup={setPopUp}
                            title={videoDetails?.title}
                            description={videoDetails?.description}
                            videoId={videoDetails?._id}
                            thumbnail={videoDetails?.thumbnail?.url}
                        />
                    </div>
                )}

                {popUp.editLive && liveDetails && (
                    <EditLiveStream
                        streamId={liveDetails.streamId}
                        title={liveDetails.title}
                        description={liveDetails.description}
                        thumbnail={liveDetails.thumbnail?.url}
                        onClose={() => {
                            setPopUp((prev) => ({ ...prev, editLive: false }));
                            dispatch(fetchMyLiveStreams());
                        }}
                    />
                )}

                {popUp.deleteVideo && (
                    <div className="w-full fixed top-52 flex justify-center z-20">
                        <DeleteConfirmation
                            video={true}
                            onCancel={() =>
                                setPopUp((prev) => ({
                                    ...prev,
                                    deleteVideo: !prev.deleteVideo,
                                }))
                            }
                            onDelete={handleDeleteVideo}
                        />
                    </div>
                )}

                {popUp.deleteLive && (
                    <div className="w-full fixed top-52 flex justify-center z-20">
                        <DeleteConfirmation
                            video={true}
                            onCancel={() =>
                                setPopUp((prev) => ({
                                    ...prev,
                                    deleteLive: false,
                                }))
                            }
                            onDelete={handleDeleteLive}
                        />
                    </div>
                )}

                {(deleting || deletingLive) && (
                    <div className="w-full fixed top-20 flex justify-center z-20">
                        <div className="w-52 border border-slate-600 bg-black flex gap-2 p-3">
                            <Spinner />
                            <span className="text-md font-bold">
                                {deletingLive
                                    ? "Deleting livestream..."
                                    : "Deleting video..."}
                            </span>
                        </div>
                    </div>
                )}

                <HeaderSection
                    username={username}
                    setPopUp={setPopUp}
                />

                <StatsSection dashboard={dashboard} />

                <section className="space-y-3">
                    <div className="flex items-center justify-between gap-2 px-1">
                        <h2 className="text-lg font-semibold">Livestreams</h2>
                        <Link to="/go-live">
                            <Button className="bg-purple-600 hover:bg-purple-500 px-3 py-1 text-sm">
                                Go Live
                            </Button>
                        </Link>
                    </div>
                    {myStreams?.length ? (
                        <div className="overflow-x-auto border border-slate-700">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-[#222222] text-slate-300">
                                    <tr>
                                        <th className="p-2">Stream</th>
                                        <th className="p-2">Status</th>
                                        <th className="p-2">Visibility</th>
                                        <th className="p-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myStreams.map((stream) => (
                                        <tr
                                            key={stream.streamId}
                                            className="border-t border-slate-700"
                                        >
                                            <td className="p-2">
                                                <div className="flex items-center gap-3 min-w-[12rem]">
                                                    <div className="w-16 h-10 bg-black overflow-hidden shrink-0">
                                                        {stream.thumbnail?.url ? (
                                                            <img
                                                                src={
                                                                    stream
                                                                        .thumbnail
                                                                        .url
                                                                }
                                                                alt=""
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : null}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium line-clamp-1">
                                                            {stream.title}
                                                        </p>
                                                        <p className="text-xs text-slate-400 line-clamp-1">
                                                            {stream.description ||
                                                                "No description"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-2 capitalize">
                                                {stream.status === "live" ? (
                                                    <Link
                                                        to={`/live/${stream.streamId}`}
                                                        className="text-red-400 underline"
                                                    >
                                                        live
                                                    </Link>
                                                ) : stream.recording?.status ===
                                                  "ready" ? (
                                                    <Link
                                                        to={`/live/${stream.streamId}`}
                                                        className="text-purple-400 underline"
                                                    >
                                                        ended · replay
                                                    </Link>
                                                ) : stream.recording?.status ===
                                                  "processing" ? (
                                                    <span className="text-slate-400">
                                                        ended · processing
                                                    </span>
                                                ) : stream.recording?.status ===
                                                  "failed" ? (
                                                    <span className="text-red-300">
                                                        ended · failed
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">
                                                        ended · no recording
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-2 capitalize">
                                                {stream.visibility}
                                            </td>
                                            <td className="p-2">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        className="hover:text-purple-400"
                                                        aria-label="Edit livestream"
                                                        onClick={() => {
                                                            setLiveDetails(
                                                                stream
                                                            );
                                                            setPopUp(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    editLive: true,
                                                                })
                                                            );
                                                        }}
                                                    >
                                                        <GrEdit size={18} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="hover:text-red-400"
                                                        aria-label="Delete livestream"
                                                        onClick={() => {
                                                            setLiveDetails(
                                                                stream
                                                            );
                                                            setPopUp(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    deleteLive: true,
                                                                })
                                                            );
                                                        }}
                                                    >
                                                        <ImBin size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-slate-400 text-sm px-1">
                            No livestreams yet.
                        </p>
                    )}
                </section>

                <VideoTable
                    videos={videos}
                    setPopUp={setPopUp}
                    setVideoDetails={setVideoDetails}
                />
            </div>
        </Container>
    );
}

export default AdminDashboard;
