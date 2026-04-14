import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Wall } from "@/lib/types";

interface WallWithMeta extends Wall {
  routeCount: number;
  newRoutes: number;
}

export function useWalls() {
  const [walls, setWalls] = useState<WallWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      const { data: wallRows } = await supabase
        .from("walls")
        .select("*")
        .order("display_order");

      if (!wallRows) {
        setLoading(false);
        return;
      }

      const { data: routeRows } = await supabase
        .from("routes")
        .select("id, wall_id, created_at")
        .eq("active", true);

      const routes = routeRows || [];

      const enriched: WallWithMeta[] = wallRows.map((w) => {
        const wallRoutes = routes.filter((r) => r.wall_id === w.id);
        const newRoutes = wallRoutes.filter(
          (r) => new Date(r.created_at) >= fiveDaysAgo
        ).length;

        return {
          ...(w as Wall),
          routeCount: wallRoutes.length,
          newRoutes,
        };
      });

      setWalls(enriched);
      setLoading(false);
    }

    load();
  }, []);

  return { walls, loading };
}
