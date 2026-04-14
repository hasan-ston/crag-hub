import { useState } from "react";
import { motion } from "motion/react";
import { Zap, CheckCircle2, Target, X, Clock, User } from "lucide-react";
import { useLogs } from "@/hooks/use-logs";
import type { RouteWithStatus, LogType } from "@/lib/types";

interface Props {
  route: RouteWithStatus;
  color: string;
  onClose: () => void;
  onLogComplete: () => void;
}

const LOG_ACTIONS = [
  { label: "Flash", type: "flash" as LogType, icon: Zap, color: "#eab308", desc: "First try" },
  { label: "Send", type: "send" as LogType, icon: CheckCircle2, color: "#22c55e", desc: "Completed" },
  { label: "Project", type: "project" as LogType, icon: Target, color: "#a855f7", desc: "Working on it" },
];

export function RouteBottomSheet({ route, color, onClose, onLogComplete }: Props) {
  const { createLog } = useLogs();
  const [justLogged, setJustLogged] = useState<string | null>(null);

  const handleLog = async (logType: LogType) => {
    setJustLogged(logType);
    await createLog(route.id, logType);
    setTimeout(() => {
      setJustLogged(null);
      onLogComplete();
    }, 1200);
  };

  const createdDate = new Date(route.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="absolute bottom-0 left-0 right-0 z-40 rounded-t-3xl bg-[#232329] border-t border-[#333340]"
      style={{ maxHeight: "55vh" }}
    >
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-[#444450]" />
      </div>

      <div className="px-5 pb-8">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full shrink-0"
              style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}50` }}
            />
            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-[32px] text-white"
                  style={{ fontWeight: 800, lineHeight: 1 }}
                >
                  {route.grade}
                </span>
                {route.name && (
                  <span
                    className="text-[16px] text-white/70"
                    style={{ fontWeight: 500 }}
                  >
                    {route.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                {route.setter && (
                  <span className="flex items-center gap-1 text-[12px] text-[#8a8a96]">
                    <User size={11} /> {route.setter}
                  </span>
                )}
                <span className="flex items-center gap-1 text-[12px] text-[#8a8a96]">
                  <Clock size={11} /> {createdDate}
                </span>
              </div>

              {route.userLogType && !justLogged && (
                <div className="mt-2">
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-[11px] text-white"
                    style={{
                      fontWeight: 600,
                      backgroundColor:
                        route.userLogType === "flash"
                          ? "#eab308"
                          : route.userLogType === "send"
                          ? "#22c55e"
                          : "#a855f7",
                    }}
                  >
                    {route.userLogType === "flash"
                      ? "Flashed"
                      : route.userLogType === "send"
                      ? "Sent"
                      : "Projecting"}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2a2a32] flex items-center justify-center mt-1"
          >
            <X size={16} className="text-[#8a8a96]" />
          </button>
        </div>

        <div className="flex gap-3">
          {LOG_ACTIONS.map((action) => {
            const isLogged = justLogged === action.type;
            return (
              <button
                key={action.type}
                onClick={() => handleLog(action.type)}
                disabled={!!justLogged}
                className="flex-1 flex flex-col items-center gap-1.5 rounded-2xl py-4 transition-all duration-200 active:scale-95 disabled:opacity-60"
                style={{
                  backgroundColor: isLogged ? action.color : "#2a2a32",
                  boxShadow: isLogged
                    ? `0 0 20px ${action.color}40`
                    : "none",
                }}
              >
                <action.icon
                  size={24}
                  className="transition-colors"
                  style={{ color: isLogged ? "#fff" : action.color }}
                  strokeWidth={2.2}
                />
                <span
                  className="text-[14px] transition-colors"
                  style={{
                    fontWeight: 700,
                    color: isLogged ? "#fff" : "#f0f0f2",
                  }}
                >
                  {isLogged ? "Logged!" : action.label}
                </span>
                <span
                  className="text-[11px] transition-colors"
                  style={{ color: isLogged ? "#ffffffcc" : "#8a8a96" }}
                >
                  {action.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
