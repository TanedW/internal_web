"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  Home,
  Mail,
  Briefcase,
  LayoutGrid,
  Users,
  LogOut,
  Menu,
  MessageSquareCode,
  Search,
  FolderSearch,
  TimerReset,
  BarChart3,
} from "lucide-react";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

const ROLE_LABEL_MAP = {
  admin: "Super Admin",
  editor_manage_user: "Admin Email",
  editor_manage_org: "Admin Manage Org",
  editor_manage_case: "Admin Case",
  editor_manage_menu: "Admin Menu",
  editor_manage_flex: "Admin Flex Message",
  editor_search_duplicate_org: "Admin Search Org",
  editor_file_search: "Admin File Search",
  editor_reset_otp: "Admin Reset OTP",
  editor_richmenu_stats: "Admin Richmenu Stats"
};

const getRoleLabel = (roleValue) =>
  ROLE_LABEL_MAP[roleValue] || roleValue.replace(/_/g, " ");

const getRoleStyles = (roleValue) => {
  const role = roleValue.toLowerCase();
  if (role === "admin") {
    return {
      bg: "bg-orange-50",
      text: "text-orange-600",
      border: "border-orange-200",
      ring: "ring-orange-500",
      solid: "bg-orange-600",
    };
  }
  if (role.includes("user")) {
    return {
      bg: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-100",
      ring: "ring-purple-500",
      solid: "bg-purple-600",
    };
  } else if (
    role.includes("org") ||
    role.includes("case") ||
    role === "editor"
  ) {
    return {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
      ring: "ring-emerald-500",
      solid: "bg-emerald-600",
    };
  } else {
    return {
      bg: "bg-sky-50",
      text: "text-sky-600",
      border: "border-sky-100",
      ring: "ring-sky-500",
      solid: "bg-sky-600",
    };
  }
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
export const SIDEBAR_MENUS = [
  { title: "หน้าแรก", href: "/home", icon: <Home size={20} />, roles: ["all"] },
  {
    title: "จัดการ Email",
    href: "/manage",
    icon: <Mail size={20} />,
    roles: ["all"],
  },
  {
    title: "จัดการ Case",
    href: "/manage-case",
    icon: <Briefcase size={20} />,
    roles: ["admin", "editor", "editor_manage_case"],
  },
  {
    title: "จัดการ Menu",
    href: "/manage-richmenu",
    icon: <LayoutGrid size={20} />,
    roles: ["admin", "editor", "editor_manage_menu"],
  },
  {
    title: "จัดการหน่วยงาน",
    href: "/manage-org",
    icon: <Users size={20} />,
    roles: ["admin", "editor", "editor_manage_org", "editor_manage_org_info"],
  },
  {
    title: "จัดการ Flex Message",
    href: "/manage-flex-message",
    icon: <MessageSquareCode size={20} />,
    roles: ["admin", "editor", "editor_manage_flex"],
  },
  {
    title: "ค้นหาหน่วยงานซ้ำ",
    href: "/search-org",
    icon: <Search size={20} />,
    roles: ["admin", "editor", "editor_search_duplicate_org"],
  },
  {
    title: "จัดการไฟล์ FAQ",
    href: "/manage-file-search",
    icon: <FolderSearch size={20} />,
    roles: ["admin", "editor", "editor_file_search"],
  },
  {
    title: "Reset OTP",
    href: "/reset-otp",
    icon: <TimerReset size={20} />,
    roles: ["admin", "editor", "editor_reset_otp"],
  },
  {
    title: "สถิติ Richmenu",
    href: "/richmenu-stats",
    icon: <BarChart3 size={20} />,
    roles: ["admin", "editor", "editor_richmenu_stats"],
  },
];
export default function Sidebar({
  isDesktopSidebarOpen,
  setIsDesktopSidebarOpen,
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [adminData, setAdminData] = useState(null);
  const [currentRoles, setCurrentRoles] = useState([]);
  const [isSidebarRolesExpanded, setIsSidebarRolesExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL_ADMIN = process.env.NEXT_PUBLIC_DB_CRUD_USER_API_URL;

  const getAvatarUrl = (seed) =>
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || "Admin")}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const sessionData = sessionStorage.getItem("active_sidebar_data");

        if (sessionData) {
          const cachedData = JSON.parse(sessionData);
          setAdminData(cachedData);
          setCurrentRoles(cachedData.roles || []);
          setIsLoading(false);
          refreshAdminProfileInBackground();
        } else {
          await fetchAdminProfile();
        }
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleNavigation = () => {
      setIsMobileMenuOpen(false);
    };
    handleNavigation();
  }, [pathname]);

  const isFetching = React.useRef(false);

  const fetchAdminProfile = async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    const adminId = localStorage
      .getItem("current_admin_id")
      ?.replace(/^"|"$/g, "");
    if (!adminId || !API_URL_ADMIN) {
      setIsLoading(false);
      isFetching.current = false;
      return;
    }
    try {
      const res = await fetch(`${API_URL_ADMIN}?requester_id=${adminId}`, {
        credentials: "include",
      });
      const json = await res.json();
      const data = Array.isArray(json) ? json : json.data || [];
      const myProfile = data.find(
        (u) => String(u.admin_id) === String(adminId),
      );

      if (myProfile) {
        const roles = Array.isArray(myProfile.roles)
          ? myProfile.roles
          : [myProfile.role || "guest"];
        setAdminData(myProfile);
        setCurrentRoles(roles);
        sessionStorage.setItem(
          "active_sidebar_data",
          JSON.stringify({
            ...myProfile,
            roles: roles,
          }),
        );
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
      isFetching.current = false;
    }
  };

  const refreshAdminProfileInBackground = async () => {
    const adminId = localStorage
      .getItem("current_admin_id")
      ?.replace(/^"|"$/g, "");
    if (!adminId || !API_URL_ADMIN) return;
    try {
      const res = await fetch(`${API_URL_ADMIN}?requester_id=${adminId}`, {
        credentials: "include",
      });
      const json = await res.json();
      const data = Array.isArray(json) ? json : json.data || [];
      const myProfile = data.find(
        (u) => String(u.admin_id) === String(adminId),
      );

      if (myProfile) {
        const roles = Array.isArray(myProfile.roles)
          ? myProfile.roles
          : [myProfile.role || "guest"];
        sessionStorage.setItem(
          "active_sidebar_data",
          JSON.stringify({ ...myProfile, roles }),
        );
        setAdminData(myProfile);
        setCurrentRoles(roles);
      }
    } catch (e) {}
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      const deleteCookie = (name) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      };
      deleteCookie("access_token");
      deleteCookie("user_email");
      deleteCookie("user_role");
      sessionStorage.removeItem("active_sidebar_data");
      localStorage.clear();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const hasAccess = (roles) => currentRoles.some((r) => roles.includes(r));

  const getMenuClass = (path) => {
    const isActive = pathname === path;
    return `flex items-center ${isDesktopSidebarOpen ? "gap-4 px-6" : "justify-center px-0"} py-3 rounded-xl transition-all duration-200 ${
      isActive
        ? "bg-[#111827] !text-white shadow-lg scale-[1.02]"
        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
    }`;
  };

  const SidebarRoleDisplay = () => (
    <div className="flex flex-col items-center mt-2 px-2 w-full">
      {currentRoles.length > 0 ? (
        <>
          {isSidebarRolesExpanded && isDesktopSidebarOpen ? (
            <div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200 w-full items-center">
              {currentRoles.map((role, idx) => {
                const style = getRoleStyles(role);
                return (
                  <span
                    key={idx}
                    className={`text-[9px] font-black uppercase tracking-wider ${style.bg} ${style.text} ${style.border} px-2.5 py-1 rounded-full border truncate max-w-[160px] shadow-sm`}
                  >
                    {getRoleLabel(role)}
                  </span>
                );
              })}
              <button
                onClick={() => setIsSidebarRolesExpanded(false)}
                className="btn btn-xs h-6 min-h-0 !bg-[#F1F5F9] !border-none !text-[#475569] hover:!bg-slate-200 rounded-full px-3 text-[8px] font-bold uppercase mt-1 shadow-none"
              >
                Show less
              </button>
            </div>
          ) : (
            isDesktopSidebarOpen && (
              <div className="flex items-center justify-center gap-1.5 w-full">
                {(() => {
                  const style = getRoleStyles(currentRoles[0]);
                  return (
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider ${style.bg} ${style.text} ${style.border} px-2.5 py-1 rounded-full border shadow-sm truncate max-w-[120px]`}
                    >
                      {getRoleLabel(currentRoles[0])}
                    </span>
                  );
                })()}
                {currentRoles.length > 1 && (
                  <button
                    onClick={() => setIsSidebarRolesExpanded(true)}
                    className="btn btn-xs h-6 min-h-0 !bg-[#F0F7FF] !border-none !text-[#4F46E5] hover:!bg-[#E0F0FF] rounded-full px-3 text-[9px] font-bold lowercase whitespace-nowrap shadow-none"
                  >
                    +{currentRoles.length - 1} more
                  </button>
                )}
              </div>
            )
          )}
        </>
      ) : (
        isDesktopSidebarOpen && (
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            Guest
          </span>
        )
      )}
    </div>
  );

  const SidebarHeader = () => (
    <div className="flex flex-col items-center text-center mb-8 mt-2 transition-all">
      <div
        className={`rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center transition-all duration-300 ${isDesktopSidebarOpen ? "w-24 h-24" : "w-10 h-10"}`}
      >
        <img
          src={
            adminData?.profile_url || user?.photoURL || getAvatarUrl("Admin")
          }
          alt="User Profile"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = getAvatarUrl("Admin");
          }}
        />
      </div>
      {isDesktopSidebarOpen && (
        <div className="animate-in fade-in duration-300">
          <br></br>
          <h2
            className="text-sm font-bold font-sans mt-4 px-2 break-words w-full"
            style={{ color: "#1e293b" }}
          >
            {adminData?.name || user?.displayName || "Admin User"}
          </h2>
          <SidebarRoleDisplay />
        </div>
      )}
    </div>
  );

  const SidebarSkeleton = () => (
    <div className="flex flex-col items-center w-full animate-pulse">
      <div
        className={`${isDesktopSidebarOpen ? "w-24 h-24" : "w-10 h-10"} rounded-full bg-slate-200 mb-8`}
      ></div>
      {isDesktopSidebarOpen && (
        <>
          <div className="h-4 w-32 bg-slate-200 rounded mb-4"></div>
          <div className="h-6 w-24 bg-slate-100 rounded-full mb-10"></div>
        </>
      )}
      <div className="w-full space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 w-full bg-slate-50 rounded-xl"></div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .force-light { background-color: #ffffff !important; color: #1e293b !important; }
      `,
        }}
      />

      {/* MOBILE NAVBAR */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 force-light z-40 px-4 flex items-center border-b border-slate-100 shadow-sm bg-white">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="btn btn-square btn-ghost p-0 min-h-0 h-10 w-10 hover:bg-slate-100 transition-all duration-300"
          aria-label="open sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth="2"
            fill="none"
            stroke="currentColor"
            className="inline-block size-6 transition-transform duration-300"
            style={{ color: "#1e293b" }}
          >
            <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
            <path d="M9 4v16"></path>
            <path d="M14 10l2 2l-2 2"></path>
          </svg>
        </button>
        <span className="ml-2 font-bold text-slate-800 text-[15px]">
          Admin Portal
        </span>
      </div>

      {/* MOBILE SIDEBAR DRAW */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          <div className="relative w-[280px] h-full force-light shadow-2xl flex flex-col p-8 rounded-r-[2rem] animate-in slide-in-from-left duration-300 overflow-y-auto no-scrollbar">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 right-6 p-1.5 bg-slate-50 text-slate-400 rounded-full border border-slate-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2"
                fill="none"
                stroke="currentColor"
                className={`inline-block size-6 transition-transform duration-300 ${!isDesktopSidebarOpen ? "rotate-180" : ""}`}
                style={{ color: "#1e293b" }}
              >
                <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
                <path d="M9 4v16"></path>
                <path d="M14 10l2 2l-2 2"></path>
              </svg>
            </button>
            {isLoading ? (
              <div className="mt-8">
                <SidebarSkeleton />
              </div>
            ) : (
              <div className="flex flex-col h-full animate-in fade-in duration-500">
                <SidebarHeader />
                <nav className="flex flex-col gap-1.5 flex-1 mt-6 overflow-y-auto no-scrollbar">
                  <Link
                    href="/home"
                    className={getMenuClass("/home")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Home size={20} />{" "}
                    <span className="text-[15px] font-bold">หน้าแรก</span>
                  </Link>
                  <Link
                    href="/manage"
                    className={getMenuClass("/manage")}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Mail size={20} />{" "}
                    <span className="text-[15px] font-bold">จัดการ Email</span>
                  </Link>

                  {hasAccess(["admin", "editor", "editor_manage_case"]) && (
                    <Link
                      href="/manage-case"
                      className={getMenuClass("/manage-case")}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Briefcase size={20} />{" "}
                      <span className="text-[15px] font-bold">จัดการ Case</span>
                    </Link>
                  )}
                  {hasAccess(["admin", "editor", "editor_manage_menu"]) && (
                    <Link
                      href="/manage-richmenu"
                      className={getMenuClass("/manage-richmenu")}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <LayoutGrid size={20} />{" "}
                      <span className="text-[15px] font-bold">จัดการ Menu</span>
                    </Link>
                  )}
                  {hasAccess([
                    "admin",
                    "editor",
                    "editor_manage_org_info",
                    "editor_manage_org",
                  ]) && (
                    <Link
                      href="/manage-org"
                      className={getMenuClass("/manage-org")}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Users size={20} />{" "}
                      <span className="text-[15px] font-bold">
                        จัดการหน่วยงาน
                      </span>
                    </Link>
                  )}
                  {hasAccess(["admin", "editor", "editor_manage_flex"]) && (
                    <Link
                      href="/manage-flex-message"
                      className={getMenuClass("/manage-flex-message")}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <MessageSquareCode size={20} />{" "}
                      <span className="text-[15px] font-bold">
                        จัดการ Flex Message
                      </span>
                    </Link>
                  )}
                  {hasAccess([
                    "admin",
                    "editor",
                    "editor_search_duplicate_org",
                  ]) && (
                    <Link
                      href="/search-org"
                      className={getMenuClass("/search-org")}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Search size={20} />{" "}
                      <span className="text-[15px] font-bold">
                        ค้นหาหน่วยงานซ้ำ
                      </span>
                    </Link>
                  )}
                  {hasAccess(["admin", "editor", "editor_file_search"]) && (
                    <Link
                      href="/manage-file-search"
                      className={getMenuClass("/manage-file-search")}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FolderSearch size={20} />{" "}
                      <span className="text-[15px] font-bold">
                        จัดการไฟล์ FAQ
                      </span>
                    </Link>
                  )}
                  {/* เพิ่มเมนู Reset OTP (Mobile) */}
                  {hasAccess(["admin", "editor", "editor_reset_otp"]) && (
                    <Link
                      href="/reset-otp"
                      className={getMenuClass("/reset-otp")}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <TimerReset size={20} />{" "}
                      <span className="text-[15px] font-bold">Reset OTP</span>
                    </Link>
                  )}
                  {hasAccess(["admin", "editor", "editor_richmenu_stats"]) && (
                    <Link
                      href="/richmenu-stats"
                      className={getMenuClass("/richmenu-stats")}
                    >
                      <BarChart3 size={20} className="shrink-0" />
                      {isDesktopSidebarOpen && (
                        <span className="font-bold text-[15px] whitespace-nowrap">
                          สถิติ Richmenu
                        </span>
                      )}
                    </Link>
                  )}
                </nav>
                <div className="mt-auto pt-4 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="group flex items-center gap-2.5 px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-200 w-full"
                  >
                    <div className="p-1.5 bg-red-100/50 rounded-lg group-hover:bg-red-100 transition-colors">
                      <LogOut size={20} className="text-red-500" />
                    </div>
                    <span className="text-red-600 font-bold tracking-wide text-[15px]">
                      Logout
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden lg:flex fixed top-4 bottom-4 left-4 force-light rounded-[2.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 flex-col py-10 z-50 transition-all duration-300 ease-in-out no-scrollbar ${isDesktopSidebarOpen ? "w-72 px-8" : "w-20 px-2"}`}
      >
        <div
          className={`flex items-center mb-6 ${isDesktopSidebarOpen ? "justify-end" : "justify-center"}`}
        >
          <button
            onClick={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
            className="btn btn-square btn-ghost hover:bg-slate-100 transition-all duration-300"
            aria-label="toggle sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeWidth="2"
              fill="none"
              stroke="currentColor"
              className={`inline-block size-6 transition-transform duration-300 ${!isDesktopSidebarOpen ? "rotate-180" : ""}`}
              style={{ color: "#1e293b" }}
            >
              <path d="M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z"></path>
              <path d="M9 4v16"></path>
              <path d="M14 10l2 2l-2 2"></path>
            </svg>
          </button>
        </div>

        {isLoading ? (
          <SidebarSkeleton />
        ) : (
          <div className="flex flex-col h-full animate-in fade-in duration-500 overflow-hidden">
            <SidebarHeader />

            <nav className="flex flex-col gap-1.5 flex-1 mt-4 overflow-y-auto no-scrollbar">
              <Link href="/home" className={getMenuClass("/home")}>
                <Home size={20} className="shrink-0" />
                {isDesktopSidebarOpen && (
                  <span className="font-bold text-[15px] whitespace-nowrap">
                    หน้าแรก
                  </span>
                )}
              </Link>
              <Link href="/manage" className={getMenuClass("/manage")}>
                <Mail size={20} className="shrink-0" />
                {isDesktopSidebarOpen && (
                  <span className="font-bold text-[15px] whitespace-nowrap">
                    จัดการ Email
                  </span>
                )}
              </Link>

              {hasAccess(["admin", "editor", "editor_manage_case"]) && (
                <Link
                  href="/manage-case"
                  className={getMenuClass("/manage-case")}
                >
                  <Briefcase size={20} className="shrink-0" />
                  {isDesktopSidebarOpen && (
                    <span className="font-bold text-[15px] whitespace-nowrap">
                      จัดการ Case
                    </span>
                  )}
                </Link>
              )}

              {hasAccess(["admin", "editor", "editor_manage_menu"]) && (
                <Link
                  href="/manage-richmenu"
                  className={getMenuClass("/manage-richmenu")}
                >
                  <LayoutGrid size={20} className="shrink-0" />
                  {isDesktopSidebarOpen && (
                    <span className="font-bold text-[15px] whitespace-nowrap">
                      จัดการ Menu
                    </span>
                  )}
                </Link>
              )}

              {hasAccess([
                "admin",
                "editor",
                "editor_manage_org",
                "editor_manage_org_info",
              ]) && (
                <Link
                  href="/manage-org"
                  className={getMenuClass("/manage-org")}
                >
                  <Users size={20} className="shrink-0" />
                  {isDesktopSidebarOpen && (
                    <span className="font-bold text-[15px] whitespace-nowrap">
                      จัดการหน่วยงาน
                    </span>
                  )}
                </Link>
              )}

              {hasAccess(["admin", "editor", "editor_manage_flex"]) && (
                <Link
                  href="/manage-flex-message"
                  className={getMenuClass("/manage-flex-message")}
                >
                  <MessageSquareCode size={20} className="shrink-0" />
                  {isDesktopSidebarOpen && (
                    <span className="font-bold text-[15px] whitespace-nowrap">
                      จัดการ Flex Message
                    </span>
                  )}
                </Link>
              )}

              {hasAccess([
                "admin",
                "editor",
                "editor_search_duplicate_org",
              ]) && (
                <Link
                  href="/search-org"
                  className={getMenuClass("/search-org")}
                >
                  <Search size={20} className="shrink-0" />
                  {isDesktopSidebarOpen && (
                    <span className="font-bold text-[15px] whitespace-nowrap">
                      ค้นหาหน่วยงานซ้ำ
                    </span>
                  )}
                </Link>
              )}

              {hasAccess(["admin", "editor", "editor_file_search"]) && (
                <Link
                  href="/manage-file-search"
                  className={getMenuClass("/manage-file-search")}
                >
                  <FolderSearch size={20} className="shrink-0" />
                  {isDesktopSidebarOpen && (
                    <span className="font-bold text-[15px] whitespace-nowrap">
                      จัดการไฟล์ FAQ
                    </span>
                  )}
                </Link>
              )}

              {hasAccess(["admin", "editor", "editor_reset_otp"]) && (
                <Link href="/reset-otp" className={getMenuClass("/reset-otp")}>
                  <TimerReset size={20} className="shrink-0" />
                  {isDesktopSidebarOpen && (
                    <span className="font-bold text-[15px] whitespace-nowrap">
                      Reset OTP
                    </span>
                  )}
                </Link>
              )}

              {hasAccess(["admin", "editor", "editor_richmenu_stats"]) && (
                <Link
                  href="/richmenu-stats"
                  className={getMenuClass("/richmenu-stats")}
                >
                  <BarChart3 size={20} className="shrink-0" />
                  {isDesktopSidebarOpen && (
                    <span className="font-bold text-[15px] whitespace-nowrap">
                      สถิติ Richmenu
                    </span>
                  )}
                </Link>
              )}
            </nav>

            <div
              className={`mt-auto pt-4 border-t border-slate-100 ${!isDesktopSidebarOpen && "flex justify-center"}`}
            >
              <button
                onClick={handleLogout}
                className={`group flex items-center ${isDesktopSidebarOpen ? "gap-2.5 px-4" : "justify-center"} py-3 rounded-xl hover:bg-red-50 transition-all duration-200 w-full`}
              >
                <div className="p-1.5 bg-red-100/50 rounded-lg group-hover:bg-red-100 transition-colors">
                  <LogOut size={20} className="text-red-500" />
                </div>
                {isDesktopSidebarOpen && (
                  <span className="text-red-600 font-bold tracking-wide text-[15px]">
                    Logout
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
