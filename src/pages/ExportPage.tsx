import { useState } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import type { ProcessLog, VoltageRow } from "../types";
import type { ToastMessage } from "../App";

interface Props {
  processLogs: ProcessLog[];
  voltageData: VoltageRow[];
  selectedProject: string;
  showToast: (type: ToastMessage["type"], message: string) => void;
}

export default function ExportPage({ processLogs, voltageData, selectedProject, showToast }: Props) {
  const [lastExportLogs, setLastExportLogs] = useState<string | null>(null);
  const [lastExportVoltage, setLastExportVoltage] = useState<string | null>(null);

  function exportLogs() {
    if (processLogs.length === 0) {
      showToast("error", "No process log data to export.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(
      processLogs.map((l) => ({
        ID: l.id,
        "Process Name": l.process_name,
        "Machine Name": l.machine_name,
        Status: l.status,
        "Created On": l.created_on,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Process Logs");
    const filename = `ProcessLogs_${selectedProject}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    const ts = new Date().toLocaleTimeString();
    setLastExportLogs(ts);
    showToast("success", `Exported ${processLogs.length} process log rows`);
  }

  function exportVoltage() {
    if (voltageData.length === 0) {
      showToast("error", "No voltage data to export.");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(
      voltageData.map((r, i) => ({
        "#": i + 1,
        VOLTAGE_V1: r.voltage_v1,
        VOLTAGE_V2: r.voltage_v2,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Voltage Data");
    const filename = `VoltageData_${selectedProject}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    const ts = new Date().toLocaleTimeString();
    setLastExportVoltage(ts);
    showToast("success", `Exported ${voltageData.length} voltage rows`);
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex items-center px-6 py-4 bg-white border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-900">Export</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        {!selectedProject ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <p className="font-medium">No project selected</p>
            <p className="text-sm mt-1">Select a project from the Dashboard first</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 max-w-2xl">
            {/* Process logs card */}
            <ExportCard
              title="Export Process Logs"
              description={`${processLogs.length} records from ${selectedProject}`}
              lastExport={lastExportLogs}
              icon={<FileSpreadsheet size={28} className="text-[#3b82f6]" />}
              onExport={exportLogs}
              color="#3b82f6"
            />

            {/* Voltage data card */}
            <ExportCard
              title="Export Voltage Data"
              description={`${voltageData.length} readings from ${selectedProject}`}
              lastExport={lastExportVoltage}
              icon={<FileSpreadsheet size={28} className="text-[#f97316]" />}
              onExport={exportVoltage}
              color="#f97316"
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface ExportCardProps {
  title: string;
  description: string;
  lastExport: string | null;
  icon: React.ReactNode;
  onExport: () => void;
  color: string;
}

function ExportCard({ title, description, lastExport, icon, onExport, color }: ExportCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col gap-4">
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}15` }}
      >
        {icon}
      </div>
      <div>
        <h2 className="font-semibold text-slate-800">{title}</h2>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
        {lastExport && (
          <p className="text-xs text-slate-400 mt-2">Last exported at {lastExport}</p>
        )}
      </div>
      <button
        onClick={onExport}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium text-white transition-colors"
        style={{ backgroundColor: color }}
      >
        <Download size={15} />
        Export to Excel
      </button>
    </div>
  );
}
