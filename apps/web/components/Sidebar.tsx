"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { EMOJIS } from "@/lib/emojis";
import { useAuth } from "@/contexts/AuthContext";
import type { ViewType } from "@/types";

interface NavItem {
  id: ViewType;
  icon: string;
  label: string;
  href: string;
  shortcut?: string;
}

interface NavSectionConfig {
  title: string;
  items: NavItem[];
}

const navSections: NavSectionConfig[] = [
  {
    title: "CORE JOURNEY",
    items: [
      { id: "dashboard" as ViewType, icon: EMOJIS.SCROLL, label: "Command Center", href: "/dashboard", shortcut: "O" },
      { id: "body" as ViewType, icon: EMOJIS.VESSEL, label: "Body (Baki)", href: "/dashboard/body", shortcut: "B" },
      { id: "mind" as ViewType, icon: EMOJIS.BRAIN, label: "Mind (Fang Yuan)", href: "/dashboard/mind", shortcut: "M" },
      { id: "career" as ViewType, icon: EMOJIS.CODE, label: "Career (Code)", href: "/dashboard/career", shortcut: "R" },
      { id: "finance" as ViewType, icon: EMOJIS.CAPITAL, label: "Finance", href: "/dashboard/finance", shortcut: "F" },
      { id: "german" as ViewType, icon: EMOJIS.FLAG, label: "German", href: "/dashboard/german", shortcut: "G" },
      { id: "coach" as ViewType, icon: EMOJIS.COACH, label: "AI Coach", href: "/dashboard/coach", shortcut: "C" },
    ],
  },
  {
    title: "OVERVIEW",
    items: [
      { id: "profile" as ViewType, icon: EMOJIS.USER, label: "Profile", href: "/dashboard/profile", shortcut: "U" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar when navigating (on mobile)
  const handleLinkClick = () => {
    setIsOpen(false);
  };

  // Get current view from pathname
  const currentView = useMemo(() => {
    const path = pathname.split("/").pop() || "dashboard";
    return path as ViewType;
  }, [pathname]);

  return (
    <>
      {/* Mobile toggle button - hidden when sidebar is open */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-gray-900/90 border border-gray-700 rounded-xl backdrop-blur-sm shadow-lg"
        aria-label="Open menu"
        initial={false}
        animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0.8 : 1 }}
        transition={{ duration: 0.2 }}
        style={{ pointerEvents: isOpen ? "none" : "auto" }}
      >
        <span className="text-lg">☰</span>
      </motion.button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-gray-900/95 lg:bg-gray-900/50 
          border-r border-gray-800 backdrop-blur-sm 
          flex flex-col transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        aria-label="Main navigation"
      >
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-800/50">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👑</span>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Protocol
            </span>
          </div>
          <motion.button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            whileTap={{ scale: 0.9 }}
          >
            <span className="text-xl">✕</span>
          </motion.button>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:flex items-center gap-3 p-6 border-b border-gray-800/50">
          <span className="text-2xl">👑</span>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Mirlind
            </h1>
            <p className="text-xs text-gray-500 font-mono tracking-wider">PROTOCOL v2.0</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="px-6 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = currentView === item.id || 
                    (item.id === "dashboard" && currentView === "dashboard");
                  
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={handleLinkClick}
                        className={`
                          flex items-center gap-3 px-6 py-2.5 mx-2 rounded-lg
                          transition-all duration-200 group relative
                          ${isActive 
                            ? "bg-purple-500/20 text-purple-300 border-l-2 border-purple-500" 
                            : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                          }
                        `}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-medium text-sm">{item.label}</span>
                        {item.shortcut && (
                          <kbd className="ml-auto text-xs font-mono text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded hidden lg:block">
                            {item.shortcut}
                          </kbd>
                        )}
                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute inset-0 bg-purple-500/10 rounded-lg -z-10"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-800/50">
          {user ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{user.username}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                title="Logout"
              >
                <span className="text-lg">{EMOJIS.LOGOUT}</span>
              </button>
            </div>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <span className="text-lg">{EMOJIS.LOCK}</span>
              <span className="text-sm">Sign In</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
