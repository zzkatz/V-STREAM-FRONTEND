import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

const STORAGE_KEY = "vestreams-sidebar-collapsed";

const defaultValue = {
    isCollapsed: false,
    isMobileOpen: false,
    toggleCollapsed: () => {},
    toggleMobile: () => {},
    closeMobile: () => {},
    hasSidebar: false,
};

const SidebarContext = createContext(defaultValue);

export function SidebarProvider({ children }) {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) === "true";
        } catch {
            return false;
        }
    });
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, String(isCollapsed));
        } catch {
            // ignore
        }
    }, [isCollapsed]);

    useEffect(() => {
        if (!isMobileOpen) return;

        const onKeyDown = (e) => {
            if (e.key === "Escape") setIsMobileOpen(false);
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [isMobileOpen]);

    const toggleCollapsed = useCallback(() => {
        setIsCollapsed((prev) => !prev);
    }, []);

    const toggleMobile = useCallback(() => {
        setIsMobileOpen((prev) => !prev);
    }, []);

    const closeMobile = useCallback(() => {
        setIsMobileOpen(false);
    }, []);

    const value = useMemo(
        () => ({
            isCollapsed,
            isMobileOpen,
            toggleCollapsed,
            toggleMobile,
            closeMobile,
            hasSidebar: true,
        }),
        [
            isCollapsed,
            isMobileOpen,
            toggleCollapsed,
            toggleMobile,
            closeMobile,
        ]
    );

    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    return useContext(SidebarContext);
}
