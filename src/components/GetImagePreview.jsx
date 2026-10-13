import React, { useState } from "react";
import { Controller } from "react-hook-form";
import { FaCamera } from "react-icons/fa";
import toast from "react-hot-toast";
import { validateImageFile } from "../helpers/fileValidation";

function GetImagePreview({
    name,
    control,
    label,
    defaultValue = "",
    className,
    cameraIcon = false,
    cameraSize = 20,
    image,
    required = true,
}) {
    const [preview, setPreview] = useState(null);

    const rules = {
        ...(required ? { required: `${name} is required` } : {}),
        validate: (value) => {
            const file = value?.[0];
            if (!file) {
                return required ? `${name} is required` : true;
            }
            const result = validateImageFile(file);
            return result.ok || result.message;
        },
    };

    return (
        <div className="w-full">
            <label
                htmlFor={name}
                className="cursor-pointer relative flex flex-col justify-center items-start"
            >
                {label && (
                    <label className="inline-block mb-2 pl-1">{label}</label>
                )}
                <img
                    src={preview || image}
                    className={className}
                />
                {cameraIcon && (
                    <FaCamera
                        size={cameraSize}
                        className="hover:text-purple-500 absolute inline-flex justify-center items-center w-full"
                    />
                )}
                <Controller
                    name={name}
                    control={control}
                    defaultValue={defaultValue || ""}
                    rules={rules}
                    render={({ field: { onChange } }) => (
                        <input
                            id={name}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/svg+xml"
                            className="hidden"
                            onChange={(e) => {
                                const files = e.target.files;
                                const file = files?.[0];

                                if (!file) {
                                    setPreview(null);
                                    onChange("");
                                    return;
                                }

                                const result = validateImageFile(file);
                                if (!result.ok) {
                                    toast.error(result.message);
                                    setPreview(null);
                                    e.target.value = "";
                                    onChange("");
                                    return;
                                }

                                setPreview(URL.createObjectURL(file));
                                onChange(files);
                            }}
                        />
                    )}
                />
            </label>
        </div>
    );
}

export default GetImagePreview;
