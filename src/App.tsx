import { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ProcessLogs from "./pages/ProcessLogs";
import VoltageTrends from "./pages/VoltageTrends";
import ExportPage from "./pages/ExportPage";
import Settings from "./pages/Settings";
import Toast from "./components/Toast";
import { api } from "./api";
import type { Page, ProcessLog, VoltageRow } from "./types";

export interface ToastMessage {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [connected, setConnected] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [projects, setProjects] = useState<string[]>([]);
  const [processLogs, setProcessLogs] = useState<ProcessLog[]>([]);
  const [voltageData, setVoltageData] = useState<VoltageRow[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingVoltage, setLoadingVoltage] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const showToast = useCallback(
    (type: ToastMessage["type"], message: string) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    },
    []
  );

  const checkConnection = useCallback(async () => {
    try {
      const ok = await api.testConnection();
      setConnected(ok);
    } catch {
      setConnected(false);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const list = await api.getProjects();
      setProjects(list);
    } catch (e) {
      showToast("error", `Failed to load projects: ${e}`);
    } finally {
      setLoadingProjects(false);
    }
  }, [showToast]);

  const loadProjectData = useCallback(
    async (db: string) => {
      if (!db) return;
      setLoadingLogs(true);
      setLoadingVoltage(true);
      try {
        const [logs, voltage] = await Promise.all([
          api.getProcessLogs(db),
          api.getVoltageData(db),
        ]);
        setProcessLogs(logs);
        setVoltageData(voltage);
        setLastUpdated(new Date());
      } catch (e) {
        showToast("error", `Failed to load data: ${e}`);
      } finally {
        setLoadingLogs(false);
        setLoadingVoltage(false);
      }
    },
    [showToast]
  );

  // Load config and initial connection check
  useEffect(() => {
    api.loadConfig().catch(() => {});
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  // Load projects when connected
  useEffect(() => {
    if (connected) loadProjects();
  }, [connected, loadProjects]);

  // Load project data when project changes
  useEffect(() => {
    if (selectedProject) loadProjectData(selectedProject);
  }, [selectedProject, loadProjectData]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc]">
      <Sidebar
        currentPage={page}
        onNavigate={setPage}
        connected={connected}
      />

      <main className="flex-1 overflow-hidden">
        {page === "dashboard" && (
          <Dashboard
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={setSelectedProject}
            processLogs={processLogs}
            voltageData={voltageData}
            loadingProjects={loadingProjects}
            loadingLogs={loadingLogs}
            loadingVoltage={loadingVoltage}
            lastUpdated={lastUpdated}
            onRefresh={() => loadProjectData(selectedProject)}
          />
        )}
        {page === "process-logs" && (
          <ProcessLogs
            db={selectedProject}
            showToast={showToast}
          />
        )}
        {page === "voltage-trends" && (
          <VoltageTrends
            db={selectedProject}
            showToast={showToast}
          />
        )}
        {page === "export" && (
          <ExportPage
            processLogs={processLogs}
            voltageData={voltageData}
            selectedProject={selectedProject}
            showToast={showToast}
          />
        )}
        {page === "settings" && (
          <Settings
            showToast={showToast}
            onSaved={() => {
              checkConnection();
              loadProjects();
            }}
          />
        )}
      </main>

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast key={t.id} type={t.type} message={t.message} />
        ))}
      </div>
    </div>
  );
}
