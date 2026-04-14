import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RouteBottomSheet } from "@/components/route-bottom-sheet";
import { ImageFallback } from "@/components/image-fallback";
import { useRoutes } from "@/hooks/use-routes";
import { ROUTE_COLORS, GRADES } from "@/lib/constants";
import type { RouteWithStatus } from "@/lib/types";

export function WallView() {
  const navigate = useNavigate();
  const { wallId } = useParams<{ wallId: string }>();
  const { routes, loading, refresh } = useRoutes(wallId || "");
  const [selectedRoute, setSelectedRoute] = useState<RouteWithStatus | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeColors, setActiveColors] = useState<Set<string>>(
    new Set(Object.keys(ROUTE_COLORS))
  );
  const [gradeRange, setGradeRange] = useState<[number, number]>([0, 10]);

  const toggleColor = useCallback((color: string) => {
    setActiveColors((prev) => {
      const next = new Set(prev);
      if (next.has(color)) next.delete(color);
      else next.add(color);
      return next;
    });
  }, []);

  const filteredRoutes = routes.filter((r) => {
    if (!activeColors.has(r.color)) return false;
    const gradeNum = parseInt(r.grade.slice(1));
    return gradeNum >= gradeRange[0] && gradeNum <= gradeRange[1];
  });

  const wallImage = routes[0]
    ? undefined
    : undefined;

  const handleLogComplete = () => {
    refresh();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#111115]">
        <Loader2 size={28} className="animate-spin text-[#a855f7]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#111115] flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-12 pb-3">
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-md"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2
          className="text-[15px] text-white/90"
          style={{ fontWeight: 600 }}
        >
          {wallId?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center justify-center w-10 h-10 rounded-full backdrop-blur-md transition-colors ${
            showFilters ? "bg-[#a855f7]" : "bg-black/50"
          }`}
        >
          <SlidersHorizontal size={18} className="text-white" />
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-28 left-4 right-4 z-30 rounded-2xl bg-[#232329]/95 backdrop-blur-lg border border-[#333340] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-[13px] text-[#8a8a96] uppercase tracking-wider"
                style={{ fontWeight: 600 }}
              >
                Filters
              </span>
              <button onClick={() => setShowFilters(false)}>
                <X size={16} className="text-[#8a8a96]" />
              </button>
            </div>

            <div className="mb-4">
              <span className="text-[12px] text-[#8a8a96] uppercase tracking-wider mb-2 block">
                Color
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ROUTE_COLORS).map(([name, hex]) => (
                  <button
                    key={name}
                    onClick={() => toggleColor(name)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      activeColors.has(name)
                        ? "border-white scale-110"
                        : "border-transparent opacity-30"
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="text-[12px] text-[#8a8a96] uppercase tracking-wider mb-2 block">
                Grade: V{gradeRange[0]} – V{gradeRange[1]}
              </span>
              <div className="flex gap-2">
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={gradeRange[0]}
                  onChange={(e) =>
                    setGradeRange([
                      Math.min(+e.target.value, gradeRange[1]),
                      gradeRange[1],
                    ])
                  }
                  className="flex-1 accent-[#a855f7]"
                />
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={gradeRange[1]}
                  onChange={(e) =>
                    setGradeRange([
                      gradeRange[0],
                      Math.max(+e.target.value, gradeRange[0]),
                    ])
                  }
                  className="flex-1 accent-[#a855f7]"
                />
              </div>
              <div className="flex justify-between mt-1">
                {GRADES.filter((_, i) => i % 2 === 0).map((g) => (
                  <span key={g} className="text-[10px] text-[#8a8a96]">
                    {g}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex-1 overflow-hidden">
        {routes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center px-8">
              <p
                className="text-[16px] text-white/70"
                style={{ fontWeight: 500 }}
              >
                No routes on this wall yet
              </p>
              <p className="text-[13px] text-[#8a8a96] mt-1">
                Routes will appear here once they're added.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 bg-[#1a1a1f]" />

            {filteredRoutes.map((route) => {
              const isSelected = selectedRoute?.id === route.id;
              const color = ROUTE_COLORS[route.color] || "#8a8a96";
              const statusIcon =
                route.userLogType === "flash" || route.userLogType === "send"
                  ? "✔"
                  : route.userLogType === "project"
                  ? "◐"
                  : null;

              return (
                <button
                  key={route.id}
                  onClick={() => setSelectedRoute(isSelected ? null : route)}
                  className="absolute transition-all duration-200"
                  style={{
                    left: `${route.region_x}%`,
                    top: `${route.region_y}%`,
                    width: `${route.region_w}%`,
                    height: `${route.region_h}%`,
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-xl border-2 transition-all duration-200"
                    style={{
                      backgroundColor: isSelected
                        ? `${color}30`
                        : `${color}18`,
                      borderColor: isSelected ? color : `${color}60`,
                      boxShadow: isSelected
                        ? `0 0 20px ${color}40, inset 0 0 15px ${color}15`
                        : "none",
                    }}
                  />
                  <div
                    className="absolute top-2 left-2 flex items-center gap-1 rounded-lg px-2 py-0.5 transition-all duration-200"
                    style={{
                      backgroundColor: isSelected ? color : `${color}cc`,
                      boxShadow: isSelected
                        ? `0 0 12px ${color}60`
                        : "none",
                    }}
                  >
                    <span
                      className="text-[12px] text-white"
                      style={{ fontWeight: 700 }}
                    >
                      {route.grade}
                    </span>
                    {statusIcon && (
                      <span className="text-[10px] text-white/90">
                        {statusIcon}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>

      {routes.length > 0 && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none z-20">
          <div className="rounded-full bg-black/60 backdrop-blur-md px-4 py-1.5">
            <span
              className="text-[12px] text-white/80"
              style={{ fontWeight: 500 }}
            >
              {filteredRoutes.length} routes visible
            </span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedRoute && (
          <RouteBottomSheet
            route={selectedRoute}
            color={ROUTE_COLORS[selectedRoute.color] || "#8a8a96"}
            onClose={() => setSelectedRoute(null)}
            onLogComplete={handleLogComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
