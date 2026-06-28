import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Search } from "lucide-react";
import Spinner from "../components/Spinner";
import { api } from "../api";
import type { ProcessLog } from "../types";
import type { ToastMessage } from "../App";

interface Props {
  db: string;
  showToast: (type: ToastMessage["type"], message: string) => void;
}

export default function ProcessLogs({ db, showToast }: Props) {
  const [logs, setLogs] = useState<ProcessLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    try {
      const data = await api.getProcessLogs(db);
      setLogs(data);
    } catch (e) {
      showToast("error", `Failed to load process logs: ${e}`);
    } finally {
      setLoading(false);
    }
  }, [db, showToast]);

  useEffect(() => {
    fetchLogs();
    intervalRef.current = setInterval(fetchLogs, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchLogs]);

  const filtered = logs.filter((l) => {
    const matchSearch =
      !search ||
      l.process_name.toLowerCase().includes(search.toLowerCase()) ||
      l.machine_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      l.status?.toUpperCase() === statusFilter.toUpperCase();
    return matchSearch && matchStatus;
  });

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Process Logs</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {filtered.length} of {logs.length} records • auto-refresh 10s
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={!db || loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-[#3b82f6] text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white border-b border-slate-100">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by process or machine…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
        >
          <option value="all">All Status</option>
          <option value="ON">ON</option>
          <option value="OFF">OFF</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {!db ? (
          <EmptyNoProject />
        ) : loading && logs.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <Spinner />
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left">
                {["ID", "Process Name", "Machine Name", "Status", "Created On"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-[#f8fafc] border-b border-slate-100"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    No records found
                  </td>
                </tr>
              ) : (
                filtered.map((log, i) => (
                  <tr
                    key={log.id}
                    className={i % 2 === 0 ? "bg-[#f8fafc]" : "bg-white"}
                  >
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{log.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{log.process_name}</td>
                    <td className="px-4 py-3 text-slate-600">{log.machine_name}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{log.created_on}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const on = status?.toUpperCase() === "ON";
  return (
    <span
      className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${
        on ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {status}
    </span>
  );
}

function EmptyNoProject() {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
      <p className="font-medium">No project selected</p>
      <p className="text-sm mt-1">Go to Dashboard and select a project first</p>
    </div>
  );
}
