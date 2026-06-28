import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Spinner from "../components/Spinner";
import Card from "../components/Card";
import { api } from "../api";
import type { VoltageRow } from "../types";
import type { ToastMessage } from "../App";

interface Props {
  db: string;
  showToast: (type: ToastMessage["type"], message: string) => void;
}

function stat(values: number[]) {
  if (values.length === 0) return { min: 0, max: 0, avg: 0 };
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return { min, max, avg };
}

export default function VoltageTrends({ db, showToast }: Props) {
  const [data, setData] = useState<VoltageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    try {
      const rows = await api.getVoltageData(db);
      setData(rows);
    } catch (e) {
      showToast("error", `Failed to load voltage data: ${e}`);
    } finally {
      setLoading(false);
    }
  }, [db, showToast]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const chartData = data.map((r, i) => ({
    idx: i + 1,
    "VOLTAGE_V1": r.voltage_v1,
    "VOLTAGE_V2": r.voltage_v2,
  }));

  const v1Stats = stat(data.map((r) => r.voltage_v1));
  const v2Stats = stat(data.map((r) => r.voltage_v2));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Voltage Trends</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {data.length} readings • auto-refresh 10s
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={!db || loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-[#3b82f6] text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {!db ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <p className="font-medium">No project selected</p>
            <p className="text-sm mt-1">Go to Dashboard and select a project first</p>
          </div>
        ) : loading && data.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <Spinner />
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              <Card title="V1 Min" value={`${v1Stats.min.toFixed(2)} V`} accent="#3b82f6" />
              <Card title="V1 Max" value={`${v1Stats.max.toFixed(2)} V`} accent="#3b82f6" />
              <Card title="V1 Average" value={`${v1Stats.avg.toFixed(2)} V`} accent="#3b82f6" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Card title="V2 Min" value={`${v2Stats.min.toFixed(2)} V`} accent="#f97316" />
              <Card title="V2 Max" value={`${v2Stats.max.toFixed(2)} V`} accent="#f97316" />
              <Card title="V2 Average" value={`${v2Stats.avg.toFixed(2)} V`} accent="#f97316" />
            </div>

            {/* Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">
                Voltage over time ({data.length} readings)
              </h2>
              {data.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                  No data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="idx"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      label={{ value: "Reading", position: "insideBottom", offset: -5, fontSize: 11 }}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={55}
                      label={{ value: "Volts", angle: -90, position: "insideLeft", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="VOLTAGE_V1"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="VOLTAGE_V2"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
