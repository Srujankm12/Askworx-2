import { Zap, LayoutDashboard, FileText, TrendingUp, Download, Settings, type LucideIcon } from "lucide-react";
import type { Page } from "../types";

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  connected: boolean;
}

const navItems: { page: Page; label: string; Icon: LucideIcon }[] = [
  { page: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { page: "process-logs", label: "Process Logs", Icon: FileText },
  { page: "voltage-trends", label: "Voltage Trends", Icon: TrendingUp },
  { page: "export", label: "Export", Icon: Download },
  { page: "settings", label: "Settings", Icon: Settings },
];

export default function Sidebar({ currentPage, onNavigate, connected }: Props) {
  return (
    <aside className="flex flex-col w-56 min-w-[14rem] h-full bg-[#0f172a] text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-slate-700">
        <Zap size={22} className="text-[#3b82f6]" />
        <span className="text-lg font-bold tracking-tight">PLCLogger</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(({ page, label, Icon }) => {
          const active = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors
                ${active
                  ? "bg-[#3b82f6] text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
            >
              <Icon size={18} className={active ? "text-white" : "text-slate-400"} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* Connection status */}
      <div className="flex items-center gap-2 px-4 py-4 border-t border-slate-700">
        <span
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            connected ? "bg-green-400" : "bg-red-500"
          }`}
        />
        <span className="text-xs text-slate-400">
          {connected ? "Connected" : "Disconnected"}
        </span>
      </div>
    </aside>
  );
}
