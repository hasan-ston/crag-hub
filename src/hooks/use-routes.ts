import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { Route, RouteWithStatus, LogType } from "@/lib/types";

export function useRoutes(wallId: string) {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<RouteWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: routeRows } = await supabase
      .from("routes")
      .select("*")
      .eq("wall_id", wallId)
      .eq("active", true);

    if (!routeRows) {
      setLoading(false);
      return;
    }

    let userLogs: Record<string, { type: LogType; id: string }> = {};

    if (user) {
      const routeIds = routeRows.map((r) => r.id);
      const { data: logRows } = await supabase
        .from("logs")
        .select("id, route_id, log_type")
        .eq("user_id", user.id)
        .in("route_id", routeIds);

      if (logRows) {
        for (const log of logRows) {
          const existing = userLogs[log.route_id];
          const priority: Record<string, number> = { flash: 3, send: 2, project: 1 };
          if (!existing || priority[log.log_type] > priority[existing.type]) {
            userLogs[log.route_id] = { type: log.log_type as LogType, id: log.id };
          }
        }
      }
    }

    const enriched: RouteWithStatus[] = routeRows.map((r) => ({
      ...(r as Route),
      userLogType: userLogs[r.id]?.type || null,
      userLogId: userLogs[r.id]?.id || null,
    }));

    setRoutes(enriched);
    setLoading(false);
  }, [wallId, user]);

  useEffect(() => {
    load();
  }, [load]);

  return { routes, loading, refresh: load };
}
