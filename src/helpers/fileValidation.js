export const IMAGE_MAX_BYTES = 1 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 10 * 1024 * 1024;

export const IMAGE_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
];

export const VIDEO_MIME_TYPES = [
    "video/mp4",
    "video/x-matroska",
    "video/quicktime",
];

export const VIDEO_EXTENSIONS = [".mp4", ".mkv", ".mov"];

const getExtension = (filename = "") => {
    const idx = filename.lastIndexOf(".");
    return idx >= 0 ? filename.slice(idx).toLowerCase() : "";
};

export const validateImageFile = (file) => {
    if (!file) {
        return { ok: false, message: "Image file is required" };
    }

    if (!IMAGE_MIME_TYPES.includes(file.type)) {
        return {
            ok: false,
            message: "Only JPEG, PNG, WebP, and SVG images are allowed",
        };
    }

    if (file.size > IMAGE_MAX_BYTES) {
        return { ok: false, message: "Image must be 1MB or smaller" };
    }

    return { ok: true, message: "" };
};

export const validateVideoFile = (file) => {
    if (!file) {
        return { ok: false, message: "Video file is required" };
    }

    const ext = getExtension(file.name);
    const mimeOk = VIDEO_MIME_TYPES.includes(file.type);
    const extOk = VIDEO_EXTENSIONS.includes(ext);

    if (!mimeOk && !extOk) {
        return {
            ok: false,
            message: "Only MP4, MKV, and MOV videos are allowed",
        };
    }

    if (file.size > VIDEO_MAX_BYTES) {
        return { ok: false, message: "Video must be 10MB or smaller" };
    }

    return { ok: true, message: "" };
};
