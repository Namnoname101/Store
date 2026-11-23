"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  Search,
  ShieldCheck,
  Send,
  PanelLeftClose,
  PanelLeftOpen,
  PanelLeft,
  X,
  LogIn,
  Wallet,
  Compass,
  Coins,
  BookOpen,
  Terminal,
  Activity,
  Database,
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  balance: number;
  role?: string;
  isAffiliate?: boolean;
}

export default function AppSidebar() {
  const { isCollapsed, isMobileOpen, toggleSidebar, setMobileOpen } = useSidebar();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [openTrees, setOpenTrees] = useState<{ chatgpt: boolean; claude: boolean }>({
    chatgpt: true,
    claude: true,
  });
  const pathname = usePathname();
  const router = useRouter();

  // Fetch live authentication session
  useEffect(() => {
    const fetchUser = () => {
      fetch("/api/auth/me")
        .then((res) => res.json())
        .then((data) => {
          if (data?.authenticated && data?.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        })
        .catch(() => setUser(null));
    };

    fetchUser();
    window.addEventListener("auth-change", fetchUser);
    return () => window.removeEventListener("auth-change", fetchUser);
  }, []);

  // Hide sidebar entirely on admin routes
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const toggleTree = (key: "chatgpt" | "claude") => {
    setOpenTrees((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNavClick = (url: string) => {
    setMobileOpen(false);
    router.push(url);
  };

  // SVGs for Official Authentic Logos
  const svgOpenAI = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#10A37F" className="shrink-0">
      <path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z" />
    </svg>
  );

  const svgClaude = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#D97757" className="shrink-0">
      <path d="M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z" />
    </svg>
  );

  const svgGemini = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#3186FF" className="shrink-0">
      <path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z" />
    </svg>
  );

  const svgCanva = (
    <svg width="20" height="20" viewBox="0 0 80 80" fill="none" className="shrink-0">
      <defs>
        <radialGradient id="sb_canva_g0" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(15.453 70.9057) rotate(-49.416) scale(61.8733)">
          <stop stopColor="#6420FF" />
          <stop offset="1" stopColor="#6420FF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sb_canva_g1" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(21.1788 9.09457) rotate(54.703) scale(69.7735)">
          <stop stopColor="#00C4CC" />
          <stop offset="1" stopColor="#00C4CC" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="40" cy="40" r="40" fill="#7D2AE7" />
      <circle cx="40" cy="40" r="40" fill="url(#sb_canva_g0)" />
      <circle cx="40" cy="40" r="40" fill="url(#sb_canva_g1)" />
      <path d="M57.2691 48.2052C56.939 48.2052 56.6485 48.484 56.3462 49.0928C52.9323 56.0153 47.0358 60.9134 40.2125 60.9134C32.3228 60.9134 27.437 53.7913 27.437 43.9522C27.437 27.2855 36.7232 17.6491 44.8796 17.6491C48.691 17.6491 51.0186 20.0443 51.0186 23.8559C51.0186 28.3796 48.4485 30.7748 48.4485 32.3702C48.4485 33.0864 48.8939 33.5201 49.7773 33.5201C53.3264 33.5201 57.4918 29.4419 57.4918 23.6808C57.4918 18.0947 52.63 13.9888 44.4737 13.9888C30.994 13.9888 19.0142 26.4858 19.0142 43.777C19.0142 57.1614 26.6572 66.0061 38.45 66.0061C50.9668 66.0061 58.2043 53.5526 58.2043 49.5105C58.2043 48.6153 57.7466 48.2052 57.2691 48.2052Z" fill="white" />
    </svg>
  );

  const svgCapCut = (
    <svg width="20" height="20" viewBox="0 0 25 25" fill="currentColor" fillRule="evenodd" className="shrink-0 text-white">
      <path d="M24.189 6.442V2.671l-4.535 2.383V4.91c.002-1.505-1.078-2.411-2.638-2.411H2.64C.993 2.5 0 3.407 0 4.91V8.72L6.354 12 0 15.316v3.8C0 20.595 1 21.5 2.64 21.5h14.373c1.56 0 2.639-.907 2.639-2.382v-.197l4.536 2.409v-3.828L13.64 12 24.19 6.443zM9.982 13.873l7.797 4.083H2.157l7.825-4.083zm7.741-7.828l-7.742 4.057-7.825-4.057h15.567z" />
    </svg>
  );

  const svgDuolingo = (
    <svg width="20" height="20" viewBox="-130 -115 260 230" fill="none" className="shrink-0">
      <ellipse cx="0" cy="0" rx="112" ry="105" fill="#58CC02" />
      <path d="M-65,25 Q0,75 65,25 Q85,-35 45,-65 Q0,-80 -45,-65 Q-85,-35 -65,25 Z" fill="#78C800" />
      <path d="M-110,-10 C-135,15 -125,60 -95,75 C-90,50 -95,15 -110,-10 Z" fill="#46A302" />
      <path d="M110,-10 C135,15 125,60 95,75 C90,50 95,15 110,-10 Z" fill="#46A302" />
      <ellipse cx="-44" cy="-18" rx="34" ry="34" fill="#FFFFFF" />
      <circle cx="-38" cy="-18" r="18" fill="#4B4B4B" />
      <circle cx="-33" cy="-22" r="7" fill="#FFFFFF" />
      <ellipse cx="44" cy="-18" rx="34" ry="34" fill="#FFFFFF" />
      <circle cx="38" cy="-18" r="18" fill="#4B4B4B" />
      <circle cx="43" cy="-22" r="7" fill="#FFFFFF" />
      <polygon points="-16,-6 16,-6 0,22" fill="#FF9600" />
      <polygon points="-12,-6 12,-6 0,16" fill="#FFC800" />
      <ellipse cx="-35" cy="102" rx="18" ry="10" fill="#FF9600" />
      <ellipse cx="35" cy="102" rx="18" ry="10" fill="#FF9600" />
    </svg>
  );

  const svgNetflix = (
    <svg width="18" height="20" viewBox="0 0 111 200" fill="none" className="shrink-0">
      <path d="M0 0H36.2069V200H0V0Z" fill="#E50914" />
      <path d="M74.7931 0H111V200H74.7931V0Z" fill="#E50914" />
      <path d="M0 0H36.2069L111 200H74.7931L0 0Z" fill="#B1060F" />
      <path d="M0 0H36.2069L74.7931 100L36.2069 200H0L0 0Z" fill="#E50914" opacity="0.3" />
    </svg>
  );

  const svgMS = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0">
      <rect x="1" y="1" width="10" height="10" fill="#F25022" />
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
      <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
    </svg>
  );

  const svgSpotify = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1ED760" className="shrink-0">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.495 17.307a.754.754 0 01-1.037.25c-2.836-1.733-6.406-2.126-10.61-1.164a.755.755 0 01-.337-1.472c4.597-1.052 8.544-.61 11.734 1.349a.754.754 0 01.25 1.037zm1.467-3.262a.945.945 0 01-1.3.312c-3.246-1.996-8.196-2.574-12.036-1.408a.945.945 0 01-.555-1.808c4.385-1.332 9.851-.686 13.579 1.604a.945.945 0 01.312 1.3zm.127-3.398C15.2 8.35 8.784 8.136 5.118 9.25a1.134 1.134 0 01-.664-2.17c4.218-1.28 11.296-1.03 15.752 1.616a1.134 1.134 0 01-1.117 1.95z" />
    </svg>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#070b14] text-zinc-300 select-none border-r border-white/10">
      {/* 1. Header / Logo Brand */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 shrink-0 bg-[#080d1a]">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center font-black text-white text-xs tracking-wider shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            DEE
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white group-hover:text-blue-400 transition-colors">
                KHO DEE STORE
              </span>
              <span className="text-[9px] font-black tracking-widest px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-medium">
              Bản quyền & AI Key
            </span>
          </div>
        </Link>

        {/* Toggle Collapse Button (Desktop) & Close Button (Mobile) */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={toggleSidebar}
            title="Thu gọn thanh bên (Ctrl+B)"
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            title="Đóng danh mục"
            className="flex lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Mini User Wallet Card (Synced with auth session) */}
      <div className="p-3 border-b border-white/5 bg-[#0a1020]/50 shrink-0">
        <div className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 rounded-xl p-3">
          {user ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 group hover:opacity-85 transition-opacity"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-500/30">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-zinc-200 truncate max-w-[100px] group-hover:text-white transition-colors">
                      {user.username}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {user.role === "admin" ? "Quản trị viên" : "Thành viên"}
                    </span>
                  </div>
                </Link>
                <Link
                  href="/topup"
                  onClick={() => setMobileOpen(false)}
                  className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold shadow-xs transition-colors"
                >
                  + Nạp
                </Link>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                <span className="text-zinc-500 text-[11px]">Số dư ví:</span>
                <span className="font-bold text-white font-mono text-[13px]">
                  {new Intl.NumberFormat("vi-VN").format(user.balance || 0)}đ
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-bold border border-white/10">
                  <Wallet className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-zinc-300">Khách vãng lai</span>
                  <span className="text-[9px] text-zinc-500">Đăng nhập để nhận ưu đãi</span>
                </div>
              </div>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-colors"
              >
                <LogIn className="w-3 h-3" />
                <span>Đăng nhập</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 3. Scrollable Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs scrollbar-thin scrollbar-thumb-white/10">
        {/* Section: General Management & Useful Guides */}
        <div>
          <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Quản lý chung
          </div>
          <div className="space-y-0.5">
            {/* 1. Tất cả sản phẩm */}
            <Link
              href="/"
              onClick={() => handleNavClick("/")}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                pathname === "/"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Compass className={`w-4 h-4 ${pathname === "/" ? "text-blue-400" : "text-zinc-400"}`} />
                <span>Tất cả sản phẩm</span>
              </div>
              <span className="text-[10px] bg-white/[0.06] text-zinc-300 border border-white/10 px-1.5 py-0.5 rounded-md font-medium">
                Kho Live
              </span>
            </Link>

            {/* 2. Kiếm tiền CTV (0đ Vốn) */}
            <Link
              href={user?.isAffiliate ? "/dashboard/affiliate" : "/ctv"}
              onClick={() => handleNavClick(user?.isAffiliate ? "/dashboard/affiliate" : "/ctv")}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                pathname?.startsWith("/ctv") || pathname?.startsWith("/dashboard/affiliate")
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Coins className={`w-4 h-4 ${pathname?.startsWith("/ctv") || pathname?.startsWith("/dashboard/affiliate") ? "text-blue-400" : "text-zinc-400"}`} />
                <span>Kiếm Tiền CTV</span>
              </div>
              <span className="text-[10px] bg-white/[0.06] text-zinc-300 border border-white/10 px-1.5 py-0.5 rounded-md font-medium">
                0đ Vốn
              </span>
            </Link>

            {/* 3. Master Prompt AI */}
            <Link
              href="/tools/prompt-master"
              onClick={() => handleNavClick("/tools/prompt-master")}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                pathname === "/tools/prompt-master"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]"
              }`}
            >
              <Sparkles className={`w-4 h-4 ${pathname === "/tools/prompt-master" ? "text-blue-400" : "text-zinc-400"}`} />
              <span>Prompt AI Master</span>
            </Link>

            {/* 4. Cấu hình API Claude */}
            <Link
              href="/huong-dan/api-claude"
              onClick={() => handleNavClick("/huong-dan/api-claude")}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                pathname === "/huong-dan/api-claude"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]"
              }`}
            >
              <BookOpen className={`w-4 h-4 ${pathname === "/huong-dan/api-claude" ? "text-blue-400" : "text-zinc-400"}`} />
              <span>Cấu Hình API Claude</span>
            </Link>

            {/* 5. Kích hoạt App ChatGPT */}
            <Link
              href="/huong-dan/codex"
              onClick={() => handleNavClick("/huong-dan/codex")}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                pathname === "/huong-dan/codex"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]"
              }`}
            >
              <Terminal className={`w-4 h-4 ${pathname === "/huong-dan/codex" ? "text-blue-400" : "text-zinc-400"}`} />
              <span>Kích Hoạt App ChatGPT</span>
            </Link>

            {/* 6. Kiểm tra dung lượng Claude / Cursor */}
            <Link
              href="/check-usage"
              onClick={() => handleNavClick("/check-usage")}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                pathname === "/check-usage"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]"
              }`}
            >
              <Activity className={`w-4 h-4 ${pathname === "/check-usage" ? "text-blue-400" : "text-zinc-400"}`} />
              <span>Check Quota Claude / Cursor</span>
            </Link>

            {/* 7. Check Quota Codex */}
            <Link
              href="/developer/usage"
              onClick={() => handleNavClick("/developer/usage")}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                pathname === "/developer/usage"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]"
              }`}
            >
              <Database className={`w-4 h-4 ${pathname === "/developer/usage" ? "text-blue-400" : "text-zinc-400"}`} />
              <span>Check Quota Codex</span>
            </Link>
          </div>
        </div>

        {/* Section: AI Models & Dev APIs */}
        <div>
          <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Mô hình AI & Dev API
          </div>
          <div className="space-y-1">
            {/* ChatGPT Tree */}
            <div>
              <button
                type="button"
                onClick={() => toggleTree("chatgpt")}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-zinc-300 font-medium hover:text-white hover:bg-white/[0.06] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  {svgOpenAI}
                  <span className="text-xs font-medium">ChatGPT / OpenAI</span>
                </div>
                {openTrees.chatgpt ? (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                )}
              </button>
              {openTrees.chatgpt && (
                <div className="ml-4 pl-3 border-l border-white/10 space-y-0.5 mt-1">
                  <Link
                    href="/brand/chatgpt?type=account"
                    onClick={() => handleNavClick("/brand/chatgpt?type=account")}
                    className={`block py-1 px-2 rounded-md text-[11.5px] transition-colors ${
                      pathname === "/brand/chatgpt"
                        ? "text-blue-400 bg-blue-600/15 border border-blue-500/20 font-medium"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]"
                    }`}
                  >
                    Tài khoản ChatGPT
                  </Link>
                  <Link
                    href="/brand/codex"
                    onClick={() => handleNavClick("/brand/codex")}
                    className={`block py-1 px-2 rounded-md text-[11.5px] transition-colors ${
                      pathname === "/brand/codex"
                        ? "text-blue-400 bg-blue-600/15 border border-blue-500/20 font-medium"
                        : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]"
                    }`}
                  >
                    API Codex
                  </Link>
                </div>
              )}
            </div>

            {/* Claude Direct Link (5 gói API Claude) */}
            <Link
              href="/brand/claude"
              onClick={() => handleNavClick("/brand/claude")}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                pathname === "/brand/claude"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-center gap-2">
                {svgClaude}
                <span className="text-xs font-medium">API Claude 5.5 / 5.6</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            </Link>

            {/* Gemini Link */}
            <Link
              href="/brand/gemini"
              onClick={() => handleNavClick("/brand/gemini")}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                pathname === "/brand/gemini"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-center gap-2">
                {svgGemini}
                <span className="text-xs font-medium">Google Gemini</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            </Link>

            {/* Grok & Cursor AI Link */}
            <Link
              href="/brand/grok"
              onClick={() => handleNavClick("/brand/grok")}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                pathname === "/brand/grok"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-[18px] h-[18px] rounded bg-white/10 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                  𝕏
                </span>
                <span className="text-xs font-medium">Grok &amp; Cursor AI</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            </Link>

            {/* MUSE AI Link */}
            <Link
              href="/brand/muse"
              onClick={() => handleNavClick("/brand/muse")}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
                pathname === "/brand/muse"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-[18px] h-[18px] text-sky-400 shrink-0" />
                <span className="text-xs font-medium">MUSE AI (2B / 31B)</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
            </Link>
          </div>
        </div>

        {/* Section: Apps & Tools */}
        <div>
          <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Ứng dụng &amp; Công cụ
          </div>
          <div className="space-y-0.5">
            <Link
              href="/brand/youtube"
              onClick={() => handleNavClick("/brand/youtube")}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                pathname === "/brand/youtube"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <rect x="1" y="4" width="22" height="16" rx="5" fill="#FF0000" />
                <polygon points="10,8.5 16,12 10,15.5" fill="#FFFFFF" />
              </svg>
              <span className="font-medium text-xs">YouTube Premium</span>
            </Link>
            <Link
              href="/brand/netflix"
              onClick={() => handleNavClick("/brand/netflix")}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                pathname === "/brand/netflix"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {svgNetflix}
              <span className="font-medium text-xs">Netflix Premium 4K</span>
            </Link>
            <Link
              href="/brand/canva"
              onClick={() => handleNavClick("/brand/canva")}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                pathname === "/brand/canva"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {svgCanva}
              <span className="font-medium text-xs">Canva Pro (100 Slots)</span>
            </Link>
            <Link
              href="/brand/capcut"
              onClick={() => handleNavClick("/brand/capcut")}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                pathname === "/brand/capcut"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {svgCapCut}
              <span className="font-medium text-xs">CapCut Pro</span>
            </Link>
            <Link
              href="/brand/wink"
              onClick={() => handleNavClick("/brand/wink")}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                pathname === "/brand/wink"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <span className="w-5 h-5 rounded-[5px] bg-gradient-to-tr from-pink-500 to-violet-500 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                W
              </span>
              <span className="font-medium text-xs">Wink VIP+ (7D / 90D)</span>
            </Link>
            <Link
              href="/brand/meitu"
              onClick={() => handleNavClick("/brand/meitu")}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                pathname === "/brand/meitu"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <div className="w-5 h-5 relative rounded-[5px] overflow-hidden shrink-0 shadow-xs">
                <Image
                  src="/images/raw_logos/meitu.png"
                  alt="Meitu VIP"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-medium text-xs">Meitu VIP</span>
            </Link>
            <Link
              href="/brand/adobe"
              onClick={() => handleNavClick("/brand/adobe")}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                pathname === "/brand/adobe"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <span className="w-5 h-5 rounded-[5px] bg-[#FA0F00] text-white font-black text-[11px] flex items-center justify-center shrink-0">
                A
              </span>
              <span className="font-medium text-xs">Adobe Creative Cloud</span>
            </Link>
            <Link
              href="/brand/figma"
              onClick={() => handleNavClick("/brand/figma")}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                pathname === "/brand/figma"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <span className="w-5 h-5 rounded-[5px] bg-violet-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                F
              </span>
              <span className="font-medium text-xs">Figma Pro Edu 2 Năm</span>
            </Link>
            <Link
              href="/brand/duolingo"
              onClick={() => handleNavClick("/brand/duolingo")}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                pathname === "/brand/duolingo"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {svgDuolingo}
              <span className="font-medium text-xs">Duolingo Super</span>
            </Link>
            <Link
              href="/brand/office"
              onClick={() => handleNavClick("/brand/office")}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                pathname === "/brand/office"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-300 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {svgMS}
              <span className="font-medium text-xs">Microsoft 365</span>
            </Link>
          </div>
        </div>

        {/* Section: Help & Support */}
        <div>
          <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Hỗ trợ & Tra cứu
          </div>
          <div className="space-y-0.5">
            <Link
              href="/lookup"
              onClick={() => handleNavClick("/lookup")}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
                pathname === "/lookup"
                  ? "bg-blue-600/15 text-blue-400 border border-blue-500/20 font-medium"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tra cứu đơn hàng</span>
            </Link>
            <a
              href="https://t.me/daitruongkocode"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Hỗ trợ & Bảo hành</span>
            </a>
          </div>
        </div>
      </div>

      {/* 4. Footer Telegram */}
      <div className="p-3 border-t border-white/5 bg-[#080d1a] shrink-0">
        <a
          href="https://t.me/daitruongkocode"
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/[0.05] hover:bg-white/10 text-zinc-200 font-medium text-xs border border-white/10 transition-all"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <Send className="w-3.5 h-3.5 text-zinc-400" />
          <span>Hỗ trợ Telegram 24/7</span>
        </a>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar: Fixed on left, width 268px, slide animation */}
      <aside
        aria-label="Thanh điều hướng danh mục chính"
        className={`hidden lg:block fixed inset-y-0 left-0 w-[268px] z-40 transition-transform duration-300 ease-in-out ${
          isCollapsed ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Floating Re-open Button when desktop sidebar is collapsed */}
      {isCollapsed && (
        <button
          type="button"
          onClick={toggleSidebar}
          title="Mở thanh danh mục (Ctrl+B)"
          className="hidden lg:flex fixed top-3 left-3 z-40 items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/95 dark:bg-[#0b1222]/95 border border-slate-700/80 dark:border-white/10 text-white text-xs font-semibold shadow-xl backdrop-blur-md hover:bg-slate-800 dark:hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 animate-in fade-in zoom-in-95 duration-200"
        >
          <PanelLeftOpen className="w-4 h-4 text-blue-400" />
          <span>Mở Danh Mục</span>
          <kbd className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-zinc-400 font-mono">Ctrl+B</kbd>
        </button>
      )}

      {/* Mobile Drawer (with Backdrop overlay) */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
        {/* Drawer Panel */}
        <aside
          className={`absolute inset-y-0 left-0 w-[280px] max-w-[85vw] shadow-2xl transition-transform duration-300 ease-out ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
}
