"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";

interface SidebarContextType {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setMobileOpen: (open: boolean) => void;
  toggleMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Desktop collapse state (default is false: visible on desktop)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  // Mobile drawer state (default is false: hidden on mobile)
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Initialize from localStorage on client
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kho_dee_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
    try {
      localStorage.setItem("kho_dee_sidebar_collapsed", String(collapsed));
    } catch {
      // Ignore
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("kho_dee_sidebar_collapsed", String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev) => !prev);
  }, []);

  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  // Sync CSS custom property and admin-layout class for layout shifting
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isAdmin) {
        document.body.classList.add("admin-layout");
        document.documentElement.style.setProperty("--sidebar-offset", "0px");
      } else {
        document.body.classList.remove("admin-layout");
        document.documentElement.style.setProperty(
          "--sidebar-offset",
          isCollapsed ? "0px" : "268px"
        );
      }
    }
  }, [isCollapsed, isAdmin]);

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle desktop sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // Listen to custom window events for open-sidebar from external buttons
  useEffect(() => {
    const handleOpenEvent = () => setIsMobileOpen(true);
    const handleCloseEvent = () => setIsMobileOpen(false);
    window.addEventListener("open-mobile-sidebar", handleOpenEvent);
    window.addEventListener("close-mobile-sidebar", handleCloseEvent);
    return () => {
      window.removeEventListener("open-mobile-sidebar", handleOpenEvent);
      window.removeEventListener("close-mobile-sidebar", handleCloseEvent);
    };
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        isMobileOpen,
        toggleSidebar,
        setCollapsed,
        setMobileOpen: setIsMobileOpen,
        toggleMobile,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

const defaultSidebarContext: SidebarContextType = {
  isCollapsed: false,
  isMobileOpen: false,
  toggleSidebar: () => {},
  setCollapsed: () => {},
  setMobileOpen: () => {},
  toggleMobile: () => {},
};

export function useSidebar() {
  try {
    const context = useContext(SidebarContext);
    if (!context) {
      return defaultSidebarContext;
    }
    return context;
  } catch {
    return defaultSidebarContext;
  }
}
