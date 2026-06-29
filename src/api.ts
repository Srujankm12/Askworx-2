import { invoke } from "@tauri-apps/api/core";
import type { ProcessLog, VoltageRow, AppConfig } from "./types";

export const api = {
  testConnection: () => invoke<boolean>("test_connection"),
  getProjects: () => invoke<string[]>("get_projects"),
  getProcessLogs: (db_name: string) =>
    invoke<ProcessLog[]>("get_process_logs", { dbName: db_name }),
  getVoltageData: (db_name: string) =>
    invoke<VoltageRow[]>("get_voltage_data", { dbName: db_name }),
  saveConfig: (server: string, database: string) =>
    invoke<void>("save_config", { server, database }),
  loadConfig: () => invoke<AppConfig>("load_config"),
};
