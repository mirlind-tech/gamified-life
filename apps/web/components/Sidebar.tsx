"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Dumbbell,
  Brain,
  Code,
  Wallet,
  Languages,
  Bot,
  User,
  LogOut,
  Menu,
  X,
  Hexagon,
} from "lucide-react";
import type { ViewType } from "@/types";

interface NavItem {
  id: ViewType;
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const IconLayoutDashboard = LayoutDashboard;
const IconDumbbell = Dumbbell;
const IconBrain = Brain;
const IconCode = Code;
const IconWallet = Wallet;
const IconLanguages = Languages;
const IconBot = Bot;
const IconUser = User;

const navSections: NavSection[] = [
  {
    title: "Core",
    items: [
      { id: "dashboard", icon: IconLayoutDashboard, label: "Dashboard", href: "/dashboard" },
      { id: "body", icon: IconDumbbell, label: "Body", href: "/dashboard/body" },
      { id: "mind", icon: IconBrain, label: "Mind", href: "/dashboard/mind" },
      { id: "career", icon: IconCode, label: "Career", href: "/dashboard/career" },
      { id: "finance", icon: IconWallet, label: "Finance", href: "/dashboard/finance" },
      { id: "german", icon: IconLanguages, label: "German", href: "/dashboard/german" },
    ],
  },
  {
    title: "Tools",
    items: [
      { id: "coach", icon: IconBot, label: "AI Coach", href: "/dashboard/coach" },
      { id: "profile", icon: IconUser, label: "Profile", href: "/dashboard/profile" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const currentView = useMemo(() => {
    const path = pathname.split("/").pop() || "dashboard";
    return path as ViewType;
  }, [pathname]);

  const handleLinkClick = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-[#1a1a25] border border-[#ffffff0f] rounded-lg"
      >
        <Menu className="w-5 h-5 text-[#a1a1b5]" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/60 z-30"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky lg:top-0 lg:left-0 z-40
          w-64 bg-[#0a0a0f] border-r border-[#ffffff0f]
          flex flex-col h-screen shrink-0
          transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#ffffff0f]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
              <Hexagon className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-semibold text-white text-sm">Mirlind</h1>
              <p className="text-[10px] text-[#6b6b80] font-mono tracking-wider">PROTOCOL</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-[#6b6b80] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {navSections.map((section) => (
            <div key={section.title} className="mb-6">
              <h3 className="px-3 text-[11px] font-medium text-[#6b6b80] uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id ||
                    (item.id === "dashboard" && pathname === "/dashboard");

                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={handleLinkClick}
                        className={`
                          relative flex items-center gap-3 px-3 py-2 rounded-lg
                          transition-all duration-150
                          ${isActive
                            ? "bg-[#1a1a25] text-cyan-400"
                            : "text-[#a1a1b5] hover:bg-[#1a1a25] hover:text-white"
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : ""}`} />
                        <span className="text-sm font-medium">{item.label}</span>
                        {isActive && (
                          <div className="absolute left-0 w-0.5 h-5 bg-cyan-400 rounded-r-full" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-[#ffffff0f]">
          {user ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#12121a]">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.username}</p>
                <p className="text-xs text-[#6b6b80] truncate">{user.email}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-[#6b6b80] hover:text-red-400 transition-colors rounded-lg hover:bg-[#1a1a25]"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-3 p-3 rounded-lg bg-[#12121a] text-[#a1a1b5] hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Sign In</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
