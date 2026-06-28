import { RefreshCw, Database, Activity, Zap, Server } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Card from "../components/Card";
import Spinner from "../components/Spinner";
import type { ProcessLog, VoltageRow } from "../types";

interface Props {
  projects: string[];
  selectedProject: string;
  onSelectProject: (p: string) => void;
  processLogs: ProcessLog[];
  voltageData: VoltageRow[];
  loadingProjects: boolean;
  loadingLogs: boolean;
  loadingVoltage: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export default function Dashboard({
  projects,
  selectedProject,
  onSelectProject,
  processLogs,
  voltageData,
  loadingProjects,
  loadingLogs,
  loadingVoltage,
  lastUpdated,
  onRefresh,
}: Props) {
  const activeMachines = processLogs.filter(
    (l) => l.status?.toUpperCase() === "ON"
  ).length;

  const miniVoltage = voltageData.slice(-20);
  const chartData = miniVoltage.map((r, i) => ({
    idx: i + 1,
    v1: r.voltage_v1,
    v2: r.voltage_v2,
  }));

  const latestV1 = voltageData.length > 0 ? voltageData[voltageData.length - 1].voltage_v1 : null;
  const latestV2 = voltageData.length > 0 ? voltageData[voltageData.length - 1].voltage_v2 : null;

  const recentLogs = processLogs.slice(0, 5);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          {lastUpdated && (
            <p className="text-xs text-slate-400 mt-0.5">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Project selector */}
          <div className="relative">
            {loadingProjects ? (
              <Spinner size={18} />
            ) : (
              <select
                value={selectedProject}
                onChange={(e) => onSelectProject(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
              >
                <option value="">Select Project…</option>
                {projects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            onClick={onRefresh}
            disabled={!selectedProject || loadingLogs || loadingVoltage}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-[#3b82f6] text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw size={15} className={(loadingLogs || loadingVoltage) ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {!selectedProject ? (
          <EmptyState />
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4">
              <Card
                title="Total Process Logs"
                value={loadingLogs ? "…" : processLogs.length}
                icon={<Database size={18} />}
                accent="#3b82f6"
              />
              <Card
                title="Active Machines"
                value={loadingLogs ? "…" : activeMachines}
                icon={<Activity size={18} />}
                accent="#22c55e"
              />
              <Card
                title="Latest Voltage V1"
                value={loadingVoltage ? "…" : latestV1 !== null ? `${latestV1.toFixed(2)} V` : "—"}
                icon={<Zap size={18} />}
                accent="#f97316"
              />
              <Card
                title="Latest Voltage V2"
                value={loadingVoltage ? "…" : latestV2 !== null ? `${latestV2.toFixed(2)} V` : "—"}
                icon={<Server size={18} />}
                accent="#a855f7"
              />
            </div>

            {/* Chart + Recent logs */}
            <div className="grid grid-cols-5 gap-4">
              {/* Mini chart */}
              <div className="col-span-3 bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">
                  Voltage Trend (last 20 readings)
                </h2>
                {loadingVoltage ? (
                  <div className="flex items-center justify-center h-40">
                    <Spinner />
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                    No voltage data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={chartData}>
                      <XAxis
                        dataKey="idx"
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={45}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="v1"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        name="V1"
                      />
                      <Line
                        type="monotone"
                        dataKey="v2"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={false}
                        name="V2"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Recent logs */}
              <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-5 overflow-hidden">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">
                  Recent Logs (last 5)
                </h2>
                {loadingLogs ? (
                  <div className="flex items-center justify-center h-40">
                    <Spinner />
                  </div>
                ) : recentLogs.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
                    No logs available
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto max-h-52">
                    {recentLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">
                            {log.process_name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {log.machine_name}
                          </p>
                        </div>
                        <StatusBadge status={log.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const on = status?.toUpperCase() === "ON";
  return (
    <span
      className={`ml-2 flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
        on ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {status}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-72 text-center">
      <Database size={48} className="text-slate-200 mb-4" />
      <p className="text-lg font-semibold text-slate-400">No project selected</p>
      <p className="text-sm text-slate-300 mt-1">
        Choose a project from the dropdown above to load data
      </p>
    </div>
  );
}
