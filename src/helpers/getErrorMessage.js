export function getErrorMessage(error, fallback = "Something went wrong") {
    const data = error?.response?.data;

    if (typeof data === "string" && data.trim()) {
        return data;
    }

    const message = data?.message;
    if (typeof message === "string" && message.trim()) {
        return message;
    }

    const errField = data?.error;
    if (typeof errField === "string" && errField.trim()) {
        return errField;
    }

    if (Array.isArray(errField) && errField.length > 0) {
        const first = errField[0];
        if (typeof first === "string") return first;
        if (first?.message) return first.message;
    }

    return fallback;
}
