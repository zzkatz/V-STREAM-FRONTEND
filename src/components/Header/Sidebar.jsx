import React from "react";
import {
    BiHistory,
    BiLike,
    CiSettings,
    HiOutlineVideoCamera,
    IoFolderOutline,
    RiHome6Line,
    TbUserCheck,
    MdOutlineLiveTv,
} from "../icons";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { IoMdLogOut } from "react-icons/io";
import { userLogout } from "../../store/Slices/authSlice";
import { useSidebar } from "../../context/SidebarContext";

function Sidebar({ variant = "desktop" }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const username = useSelector((state) => state.auth?.userData?.username);
    const { isCollapsed, isMobileOpen, closeMobile } = useSidebar();

    const sidebarTopItems = [
        {
            icon: <RiHome6Line size={25} />,
            title: "Home",
            url: "/",
        },
        {
            icon: <MdOutlineLiveTv size={25} />,
            title: "Live",
            url: "/live",
        },
        {
            icon: <BiLike size={25} />,
            title: "Liked Videos",
            url: "/liked-videos",
        },
        {
            icon: <BiHistory size={25} />,
            title: "History",
            url: "/history",
        },
        {
            icon: <HiOutlineVideoCamera size={25} />,
            title: "My Content",
            url: `/channel/${username}/videos`,
        },
        {
            icon: <IoFolderOutline size={25} />,
            title: "Collections",
            url: "/collections",
        },
        {
            icon: <TbUserCheck size={25} />,
            title: "Subscriptions",
            url: "/subscriptions",
        },
    ];

    const bottomBarItems = [
        {
            icon: <RiHome6Line size={25} />,
            title: "Home",
            url: "/",
        },
        {
            icon: <BiHistory size={25} />,
            title: "History",
            url: "/history",
        },
        {
            icon: <IoFolderOutline size={25} />,
            title: "Collections",
            url: "/collections",
        },
        {
            icon: <TbUserCheck size={25} />,
            title: "Subscriptions",
            url: "/subscriptions",
        },
    ];

    const logout = async () => {
        await dispatch(userLogout());
        closeMobile();
        navigate("/");
    };

    const navItemClass = (collapsed) =>
        `flex items-center gap-2 py-1 px-2 border border-slate-600 hover:bg-purple-500 cursor-pointer ${
            collapsed ? "justify-center" : "justify-center sm:justify-start"
        }`;

    const renderNavLinks = (collapsed, onNavigate) => (
        <>
            <div className="flex flex-col gap-4 mt-5">
                {sidebarTopItems.map((item) => (
                    <NavLink
                        to={item.url}
                        key={item.title}
                        title={item.title}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                            isActive ? "bg-purple-500" : ""
                        }
                    >
                        <div className={navItemClass(collapsed)}>
                            {item.icon}
                            {!collapsed && (
                                <span className="text-base">{item.title}</span>
                            )}
                        </div>
                    </NavLink>
                ))}
            </div>

            <div className="space-y-4 mb-4">
                {username && (
                    <div
                        className={navItemClass(collapsed)}
                        title="Logout"
                        onClick={logout}
                    >
                        <IoMdLogOut size={25} />
                        {!collapsed && (
                            <span className="text-base">Logout</span>
                        )}
                    </div>
                )}
                <div
                    className={navItemClass(collapsed)}
                    title="Settings"
                >
                    <CiSettings size={25} />
                    {!collapsed && (
                        <span className="text-base">Settings</span>
                    )}
                </div>
            </div>
        </>
    );

    if (variant === "desktop") {
        return (
            <div className="h-full w-full text-white sm:p-3 p-2 border-slate-600 border-r flex flex-col justify-between overflow-y-auto">
                {renderNavLinks(isCollapsed)}
            </div>
        );
    }

    return (
        <>
            {isMobileOpen && (
                <>
                    <button
                        type="button"
                        aria-label="Close sidebar"
                        className="sm:hidden fixed inset-0 z-40 bg-black/50"
                        onClick={closeMobile}
                    />
                    <div className="sm:hidden fixed inset-y-0 left-0 z-50 w-64 max-w-[80vw] bg-[#0F0F0F] border-r border-slate-600 text-white p-3 flex flex-col justify-between overflow-y-auto">
                        {renderNavLinks(false, closeMobile)}
                    </div>
                </>
            )}

            <div className="border-t-2 text-white h-16 sm:hidden z-20 p-1 w-full flex justify-around fixed bottom-0 left-0 right-0 bg-[#0E0F0F]">
                {bottomBarItems.map((item) => (
                    <NavLink
                        to={item.url}
                        key={item.title}
                        className={({ isActive }) =>
                            isActive ? "text-purple-500" : ""
                        }
                    >
                        <div className="flex flex-col items-center gap-1 cursor-pointer p-1 min-w-0">
                            {item.icon}
                            <span className="text-xs sm:text-sm truncate max-w-[4.5rem]">
                                {item.title}
                            </span>
                        </div>
                    </NavLink>
                ))}
            </div>
        </>
    );
}

export default Sidebar;
