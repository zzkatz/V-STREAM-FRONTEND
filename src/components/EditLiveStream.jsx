import React, { useEffect, useState } from "react";
import Input2 from "./Input2";
import { useForm } from "react-hook-form";
import { IoCloseCircleOutline } from "react-icons/io5";
import { useDispatch } from "react-redux";
import { updateLiveStream } from "../store/Slices/liveSlice";
import Spinner from "./Spinner";
import GetImagePreview from "./GetImagePreview";

function EditLiveStream({
    streamId,
    title,
    description,
    thumbnail,
    onClose,
}) {
    const {
        handleSubmit,
        register,
        formState: { errors },
        control,
        setValue,
    } = useForm();
    const dispatch = useDispatch();
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setValue("title", title || "");
        setValue("description", description || "");
    }, [title, description, setValue]);

    const onSubmit = async (data) => {
        setSaving(true);
        try {
            await dispatch(
                updateLiveStream({
                    streamId,
                    data: {
                        title: data.title,
                        description: data.description,
                        thumbnail: data.thumbnail,
                    },
                })
            ).unwrap();
            onClose?.();
        } catch {
            // toast in slice
        } finally {
            setSaving(false);
        }
    };

    if (saving) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                <div className="w-52 border border-slate-600 bg-black flex gap-2 p-3 text-white">
                    <Spinner />
                    <span className="text-md font-bold">Updating…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="bg-black space-y-2 border border-slate-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto outline-none p-2 text-white"
            >
                <div className="sticky left-0 top-0 z-50 bg-[#222222] flex justify-between items-center border-b border-slate-500 px-3 py-2">
                    <div>
                        <h2 className="font-bold">Edit Livestream</h2>
                        <p className="text-xs text-slate-400">
                            Update title, description, and thumbnail
                        </p>
                    </div>
                    <IoCloseCircleOutline
                        size={23}
                        onClick={onClose}
                        className="cursor-pointer"
                    />
                </div>
                <div className="p-2 grid lg:grid-cols-2 grid-cols-1 gap-5">
                    <div>
                        <GetImagePreview
                            name="thumbnail"
                            control={control}
                            label="Thumbnail: "
                            cameraIcon
                            cameraSize={30}
                            className="object-contain w-full min-w-xl h-72 min-h-32"
                            image={thumbnail}
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <div>
                            <Input2
                                label="Title"
                                {...register("title", {
                                    required: "Title is required",
                                })}
                            />
                            <span className="text-red-500 text-xs">
                                {errors.title?.message}
                            </span>
                        </div>
                        <label className="block text-sm space-y-1">
                            <span>Description</span>
                            <textarea
                                {...register("description")}
                                className="w-full border p-2 bg-transparent outline-none focus:bg-[#222222] min-h-[100px]"
                            />
                        </label>
                        <button
                            type="submit"
                            className="bg-purple-600 hover:bg-purple-500 px-4 py-2 text-white"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default EditLiveStream;
