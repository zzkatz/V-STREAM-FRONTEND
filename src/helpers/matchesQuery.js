export function matchesQuery(video, q) {
    const query = q?.trim().toLowerCase();
    if (!query) return true;

    const title = video?.title?.toLowerCase() || "";
    const description = video?.description?.toLowerCase() || "";
    return title.includes(query) || description.includes(query);
}

export function getSearchContext(pathname = "") {
    if (pathname.startsWith("/liked-videos")) {
        return {
            mode: "liked",
            placeholder: "Search liked videos",
            buildPath: (query) =>
                `/liked-videos?q=${encodeURIComponent(query)}`,
        };
    }

    if (pathname.startsWith("/history")) {
        return {
            mode: "history",
            placeholder: "Search history",
            buildPath: (query) => `/history?q=${encodeURIComponent(query)}`,
        };
    }

    return {
        mode: "global",
        placeholder: "Search",
        buildPath: (query) => `/search/${encodeURIComponent(query)}`,
    };
}
