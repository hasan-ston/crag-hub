import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Wall, Route } from "@/lib/types";
import { ROUTE_COLORS, GRADES } from "@/lib/constants";

export function useAdmin() {
  const [walls, setWalls] = useState<Wall[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWalls = useCallback(async () => {
    const { data } = await supabase
      .from("walls")
      .select("*")
      .order("display_order");
    setWalls((data as Wall[]) || []);
  }, []);

  const loadRoutes = useCallback(async (wallId?: string) => {
    let query = supabase.from("routes").select("*").order("created_at", { ascending: false });
    if (wallId) query = query.eq("wall_id", wallId);
    const { data } = await query;
    setRoutes((data as Route[]) || []);
  }, []);

  useEffect(() => {
    async function init() {
      await loadWalls();
      setLoading(false);
    }
    init();
  }, [loadWalls]);

  const uploadWallImage = useCallback(async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `walls/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("wall-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      console.error("Upload failed:", error.message);
      return null;
    }

    const { data } = supabase.storage.from("wall-images").getPublicUrl(path);
    return data.publicUrl;
  }, []);

  const createWall = useCallback(
    async (wall: { id: string; name: string; image_url: string; display_order: number }) => {
      const { error } = await supabase.from("walls").insert(wall);
      if (error) {
        console.error("Create wall failed:", error.message);
        return false;
      }
      await loadWalls();
      return true;
    },
    [loadWalls]
  );

  const deleteWall = useCallback(
    async (wallId: string) => {
      await supabase.from("routes").delete().eq("wall_id", wallId);
      await supabase.from("walls").delete().eq("id", wallId);
      await loadWalls();
    },
    [loadWalls]
  );

  const createRoute = useCallback(
    async (route: Omit<Route, "id" | "active" | "created_at">) => {
      const { error } = await supabase.from("routes").insert(route);
      if (error) {
        console.error("Create route failed:", error.message);
        return false;
      }
      await loadRoutes(route.wall_id);
      return true;
    },
    [loadRoutes]
  );

  const deleteRoute = useCallback(
    async (routeId: string, wallId: string) => {
      await supabase.from("routes").delete().eq("id", routeId);
      await loadRoutes(wallId);
    },
    [loadRoutes]
  );

  const toggleRouteActive = useCallback(
    async (routeId: string, active: boolean, wallId: string) => {
      await supabase.from("routes").update({ active }).eq("id", routeId);
      await loadRoutes(wallId);
    },
    [loadRoutes]
  );

  return {
    walls,
    routes,
    loading,
    uploadWallImage,
    createWall,
    deleteWall,
    createRoute,
    deleteRoute,
    toggleRouteActive,
    loadRoutes,
  };
}
