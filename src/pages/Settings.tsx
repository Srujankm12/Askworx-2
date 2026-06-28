import { useState, useEffect } from "react";
import { Save, Wifi, WifiOff, Loader } from "lucide-react";
import { api } from "../api";
import type { ToastMessage } from "../App";

interface Props {
  showToast: (type: ToastMessage["type"], message: string) => void;
  onSaved: () => void;
}

export default function Settings({ showToast, onSaved }: Props) {
  const [server, setServer] = useState(String.raw`NAGARA\SQLEXPRESS2019`);
  const [database, setDatabase] = useState("TEST123");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);

  useEffect(() => {
    api.loadConfig().then((cfg) => {
      setServer(cfg.server);
      setDatabase(cfg.database);
    }).catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await api.saveConfig(server, database);
      showToast("success", "Configuration saved successfully");
      onSaved();
    } catch (e) {
      showToast("error", `Save failed: ${e}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const ok = await api.testConnection();
      setTestResult(ok);
      showToast(ok ? "success" : "error", ok ? "Connection successful!" : "Connection failed.");
    } catch (e) {
      setTestResult(false);
      showToast("error", `Connection error: ${e}`);
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center px-6 py-4 bg-white border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-lg space-y-6">
          {/* Connection form */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-5">
            <h2 className="font-semibold text-slate-800">SQL Server Connection</h2>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Server Name</label>
              <input
                type="text"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                placeholder={String.raw`HOSTNAME\INSTANCE`}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
              />
              <p className="text-xs text-slate-400">
                Use format: <code className="bg-slate-50 px-1 rounded">HOST\INSTANCE</code> for named instances
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Default Database</label>
              <input
                type="text"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                placeholder="TEST123"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleTest}
                disabled={testing || !server}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                {testing ? (
                  <Loader size={15} className="animate-spin" />
                ) : testResult === true ? (
                  <Wifi size={15} className="text-green-500" />
                ) : testResult === false ? (
                  <WifiOff size={15} className="text-red-500" />
                ) : (
                  <Wifi size={15} />
                )}
                Test Connection
              </button>

              <button
                onClick={handleSave}
                disabled={saving || !server}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#3b82f6] text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
              >
                {saving ? (
                  <Loader size={15} className="animate-spin" />
                ) : (
                  <Save size={15} />
                )}
                Save
              </button>
            </div>

            {testResult !== null && (
              <div
                className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2.5 ${
                  testResult
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {testResult ? (
                  <Wifi size={14} />
                ) : (
                  <WifiOff size={14} />
                )}
                {testResult
                  ? "Successfully connected to SQL Server"
                  : "Unable to connect. Check server name and ensure Windows Authentication is configured."}
              </div>
            )}
          </div>

          {/* Current connection info */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Current Connection</h2>
            <div className="space-y-3">
              <InfoRow label="Authentication" value="Windows (Integrated Security)" />
              <InfoRow label="Server" value={server || "—"} />
              <InfoRow label="Database" value={database || "—"} />
              <InfoRow label="Driver" value="Tiberius (SQL Server native)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between text-sm">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="text-slate-800 text-right max-w-xs font-mono text-xs bg-slate-50 px-2 py-1 rounded">
        {value}
      </span>
    </div>
  );
}
