import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { LogType } from "@/lib/types";

export function useLogs() {
  const { user } = useAuth();

  const createLog = useCallback(
    async (routeId: string, logType: LogType) => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("logs")
        .insert({ user_id: user.id, route_id: routeId, log_type: logType })
        .select()
        .single();

      if (error) {
        console.error("Failed to create log:", error.message);
        return null;
      }

      return data;
    },
    [user]
  );

  const deleteLog = useCallback(
    async (logId: string) => {
      if (!user) return;
      await supabase.from("logs").delete().eq("id", logId).eq("user_id", user.id);
    },
    [user]
  );

  return { createLog, deleteLog };
}
