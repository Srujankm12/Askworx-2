export interface ProcessLog {
  id: number;
  process_name: string;
  machine_name: string;
  status: string;
  created_on: string;
}

export interface VoltageRow {
  voltage_v1: number;
  voltage_v2: number;
}

export interface AppConfig {
  server: string;
  database: string;
}

export type Page = "dashboard" | "process-logs" | "voltage-trends" | "export" | "settings";
