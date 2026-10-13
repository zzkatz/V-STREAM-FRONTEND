import React from "react";
import Navbar from "./components/Header/Navbar";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Header/Sidebar";
import { SidebarProvider, useSidebar } from "./context/SidebarContext";

function LayoutShell() {
    const { isCollapsed } = useSidebar();

    return (
        <div className="h-dvh w-full overflow-hidden flex flex-col">
            <Navbar />
            <div className="flex flex-1 min-h-0 w-full">
                <div
                    className={`hidden sm:block shrink-0 h-full min-h-0 overflow-hidden transition-[width] duration-300 ease-in-out ${
                        isCollapsed ? "w-16" : "w-56"
                    }`}
                >
                    <Sidebar variant="desktop" />
                </div>
                <div
                    id="main-scroll"
                    className="flex-1 min-w-0 min-h-0 h-full overflow-y-auto"
                >
                    <Outlet />
                </div>
            </div>
            <Sidebar variant="mobile" />
        </div>
    );
}

function Layout() {
    return (
        <SidebarProvider>
            <LayoutShell />
        </SidebarProvider>
    );
}

export default Layout;
