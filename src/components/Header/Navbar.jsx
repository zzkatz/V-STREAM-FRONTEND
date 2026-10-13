import React, { useEffect, useState } from "react";
import { Search, Button, Logo, SearchForSmallScreen } from "../index.js";
import { Link } from "react-router-dom";
import {
    IoCloseCircleOutline,
    BiLike,
    CiSearch,
    HiOutlineVideoCamera,
    SlMenu,
    MdOutlineLiveTv,
} from "../icons.js";
import { useSelector, useDispatch } from "react-redux";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { IoMdLogOut } from "react-icons/io";
import { userLogout } from "../../store/Slices/authSlice.js";
import { useSidebar } from "../../context/SidebarContext.jsx";
import { fetchLiveQuota } from "../../store/Slices/liveSlice.js";

function Navbar() {
    const [toggleMenu, setToggleMenu] = useState(false);
    const [openSearch, setOpenSearch] = useState(false);
    const authStatus = useSelector((state) => state.auth.status);
    const username = useSelector((state) => state.auth?.userData?.username);
    const profileImg = useSelector((state) => state.auth.userData?.avatar.url);
    const liveQuota = useSelector((state) => state.live.quota);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const {
        hasSidebar,
        isCollapsed,
        isMobileOpen,
        toggleCollapsed,
        toggleMobile,
    } = useSidebar();

    const hasActiveStream = Boolean(liveQuota?.hasActiveStream);
    const activeStreamId = liveQuota?.activeStreamId;

    useEffect(() => {
        if (authStatus) {
            dispatch(fetchLiveQuota());
        }
    }, [authStatus, dispatch, pathname]);

    const hideSearch =
        pathname.startsWith("/channel/") ||
        pathname.startsWith("/collections");

    const logout = async () => {
        await dispatch(userLogout());
        navigate("/");
    };

    const handleSidebarToggle = () => {
        if (typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches) {
            toggleCollapsed();
        } else {
            toggleMobile();
        }
    };

    const sidePanelItems = [
        {
            icon: <BiLike size={25} />,
            title: "Liked Videos",
            url: "/liked-videos",
        },
        {
            icon: <HiOutlineVideoCamera size={25} />,
            title: "My Content",
            url: `/channel/${username}`,
        },
        ...(hasActiveStream
            ? [
                  {
                      icon: <MdOutlineLiveTv size={25} />,
                      title: "Return to Live",
                      url: `/live/${activeStreamId}`,
                  },
              ]
            : [
                  {
                      icon: <MdOutlineLiveTv size={25} />,
                      title: "Go Live",
                      url: "/go-live",
                  },
              ]),
        {
            icon: <MdOutlineLiveTv size={25} />,
            title: "Live",
            url: "/live",
        },
    ];

    return (
        <>
            <nav className="w-full bg-[#0E0F0F] flex justify-between items-center p-3 sm:p-4 sm:gap-5 gap-2 border-b-2 border-gray-500 sticky top-0 z-50 min-w-0">
                <div className="flex items-center gap-2 shrink-0">
                    {hasSidebar && (
                        <button
                            type="button"
                            onClick={handleSidebarToggle}
                            aria-label="Toggle sidebar"
                            aria-expanded={!isCollapsed || isMobileOpen}
                            className="text-white p-1 rounded hover:bg-[#222222] focus:outline focus:outline-2 focus:outline-purple-500"
                        >
                            <SlMenu size={22} />
                        </button>
                    )}
                    <div className="flex items-center justify-center gap-2 cursor-pointer">
                        <Logo />
                    </div>
                </div>

                {hideSearch ? (
                    <div className="hidden sm:block flex-1 min-w-0" />
                ) : (
                    <div className="w-full max-w-xl sm:w-1/3 hidden sm:block min-w-0">
                        <Search />
                    </div>
                )}

                {!hideSearch && (
                    <div className="text-white flex-1 inline-flex justify-end sm:hidden pr-2 min-w-0">
                        <CiSearch
                            size={28}
                            fontWeight={"bold"}
                            onClick={() => setOpenSearch((prev) => !prev)}
                        />
                        {openSearch && (
                            <SearchForSmallScreen
                                open={openSearch}
                                setOpenSearch={setOpenSearch}
                            />
                        )}
                    </div>
                )}

                {hideSearch && (
                    <div className="flex-1 sm:hidden min-w-0" />
                )}

                {authStatus ? (
                    <>
                        <div className="flex sm:hidden items-center gap-2 shrink-0">
                            {hasActiveStream ? (
                                <Link to={`/live/${activeStreamId}`}>
                                    <Button className="bg-red-600 hover:bg-red-500 border border-red-500 px-2 py-1 text-xs font-semibold whitespace-nowrap">
                                        On Air
                                    </Button>
                                </Link>
                            ) : (
                                <Link to="/go-live">
                                    <Button className="bg-red-600 hover:bg-red-500 border border-red-500 px-2 py-1 text-xs font-semibold whitespace-nowrap">
                                        Go Live
                                    </Button>
                                </Link>
                            )}
                        </div>
                        <div className="hidden sm:flex items-center gap-3 shrink-0">
                            {hasActiveStream ? (
                                <Link to={`/live/${activeStreamId}`}>
                                    <Button className="bg-red-600 hover:bg-red-500 border border-red-500 sm:px-3 sm:py-1.5 px-2 py-1 text-sm font-semibold">
                                        On Air
                                    </Button>
                                </Link>
                            ) : (
                                <Link to="/go-live">
                                    <Button className="bg-red-600 hover:bg-red-500 border border-red-500 sm:px-3 sm:py-1.5 px-2 py-1 text-sm font-semibold">
                                        Go Live
                                    </Button>
                                </Link>
                            )}
                            <div className="rounded-full">
                                <img
                                    src={profileImg}
                                    alt="profileImg"
                                    className="rounded-full w-10 h-10 object-cover"
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="space-x-2 sm:block hidden">
                        <Link to={"/login"}>
                            <Button className="bg-[#222222] border hover:bg-black border-slate-500 sm:px-4 sm:py-2 p-2">
                                Login
                            </Button>
                        </Link>
                        <Link to={"/signup"}>
                            <Button className="font-semibold border hover:bg-[#222222] border-slate-500 sm:px-4 sm:py-2 ">
                                Sign up
                            </Button>
                        </Link>
                    </div>
                )}

                <div className="sm:hidden block shrink-0">
                    <div className="text-white">
                        <SlMenu
                            size={24}
                            onClick={() => setToggleMenu((prev) => !prev)}
                        />
                    </div>
                </div>

                {toggleMenu && (
                    <div className="fixed right-0 top-0 text-white flex flex-col border-l h-screen w-[min(70%,20rem)] max-w-xs bg-[#0F0F0F] sm:hidden outline-none z-[60]">
                        <div className="w-full border-b h-20 flex items-center mb-2 justify-between px-3">
                            <div className="flex items-center gap-2">
                                <Logo />
                            </div>
                            <IoCloseCircleOutline
                                size={35}
                                onClick={() => setToggleMenu((prev) => !prev)}
                            />
                        </div>

                        <div className="flex flex-col justify-between h-full py-5 px-3 j">
                            <div className="flex flex-col gap-5">
                                {sidePanelItems.map((item) => (
                                    <NavLink
                                        to={item.url}
                                        key={item.title}
                                        onClick={() =>
                                            setToggleMenu((prev) => !prev)
                                        }
                                        className={({ isActive }) =>
                                            isActive ? "bg-purple-500" : ""
                                        }
                                    >
                                        <div className="flex items-center border border-slate-500 gap-5 px-3 py-1 hover:bg-purple-500">
                                            <div>{item.icon}</div>
                                            <span className="text-lg">
                                                {item.title}
                                            </span>
                                        </div>
                                    </NavLink>
                                ))}
                            </div>

                            {!authStatus ? (
                                <div className="flex flex-col space-y-5 mb-3">
                                    <Link to={"/login"}>
                                        <Button className="w-full bg-[#222222] border hover:bg-white hover:text-black border-slate-500 py-1 px-3">
                                            Login
                                        </Button>
                                    </Link>
                                    <Link to={"/signup"}>
                                        <Button className=" w-full font-semibold border border-slate-500 hover:bg-white hover:text-black py-1 px-3">
                                            Sign up
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div
                                    className="flex gap-2 justify-start items-start cursor-pointer py-1 px-2 border border-slate-600"
                                    onClick={() => logout()}
                                >
                                    <IoMdLogOut size={25} />
                                    <span className="text-base">Logout</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </nav>
        </>
    );
}

export default Navbar;
