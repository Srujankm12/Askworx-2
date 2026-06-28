import { CheckCircle, XCircle, Info } from "lucide-react";
import type { ToastMessage } from "../App";

export default function Toast({ type, message }: Omit<ToastMessage, "id">) {
  const styles = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const Icon = type === "success" ? CheckCircle : type === "error" ? XCircle : Info;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-md text-sm max-w-xs animate-fade-in ${styles[type]}`}
    >
      <Icon size={16} className="flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
