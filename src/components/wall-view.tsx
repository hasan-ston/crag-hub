import { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RouteBottomSheet } from "@/components/route-bottom-sheet";
import { ImageFallback } from "@/components/image-fallback";
import { useRoutes } from "@/hooks/use-routes";
import { ROUTE_COLORS, GRADES } from "@/lib/constants";
import {
  getRenderableRoutePaths,
  getRoutePathCollectionCentroid,
  routePathToSvgPoints,
} from "@/lib/route-path";
import type { RouteWithStatus } from "@/lib/types";

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const safe =
    normalized.length === 3
      ? normalized
          .split("")
          .map((value) => `${value}${value}`)
          .join("")
      : normalized;

  const r = Number.parseInt(safe.slice(0, 2), 16);
  const g = Number.parseInt(safe.slice(2, 4), 16);
  const b = Number.parseInt(safe.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function brightenHex(hex: string, amount = 22) {
  const normalized = hex.replace("#", "");
  const safe =
    normalized.length === 3
      ? normalized
          .split("")
          .map((value) => `${value}${value}`)
          .join("")
      : normalized;

  const brighten = (value: string) =>
    Math.min(255, Number.parseInt(value, 16) + amount)
      .toString(16)
      .padStart(2, "0");

  return `#${brighten(safe.slice(0, 2))}${brighten(safe.slice(2, 4))}${brighten(safe.slice(4, 6))}`;
}

export function WallView() {
  const navigate = useNavigate();
  const { wallId } = useParams<{ wallId: string }>();
  const { wall, routes, loading, refresh } = useRoutes(wallId || "");
  const [selectedRoute, setSelectedRoute] = useState<RouteWithStatus | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeColors, setActiveColors] = useState<Set<string>>(new Set(Object.keys(ROUTE_COLORS)));
  const [gradeRange, setGradeRange] = useState<[number, number]>([0, 10]);

  const toggleColor = useCallback((color: string) => {
    setActiveColors((previous) => {
      const next = new Set(previous);
      if (next.has(color)) {
        next.delete(color);
      } else {
        next.add(color);
      }
      return next;
    });
  }, []);

  const filteredRoutes = routes.filter((route) => {
    if (!activeColors.has(route.color)) {
      return false;
    }

    const gradeNumber = Number.parseInt(route.grade.slice(1), 10);
    return gradeNumber >= gradeRange[0] && gradeNumber <= gradeRange[1];
  });

  const renderableRoutes = filteredRoutes.map((route) => {
    const paths = getRenderableRoutePaths(route);
    return {
      route,
      polygonPoints: paths.map((path) => routePathToSvgPoints(path)),
      centroid: getRoutePathCollectionCentroid(paths),
    };
  });

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
    <div className="fixed inset-0 flex flex-col bg-[#111115]">
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-12 pb-3">
        <button
          onClick={() => navigate("/")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-md"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <h2 className="text-[15px] text-white/90" style={{ fontWeight: 600 }}>
          {wall?.name || wallId?.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
        </h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-colors ${
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
            className="absolute top-28 left-4 right-4 z-30 rounded-2xl border border-[#333340] bg-[#232329]/95 p-4 backdrop-blur-lg"
          >
            <div className="mb-3 flex items-center justify-between">
              <span
                className="text-[13px] uppercase tracking-wider text-[#8a8a96]"
                style={{ fontWeight: 600 }}
              >
                Filters
              </span>
              <button onClick={() => setShowFilters(false)}>
                <X size={16} className="text-[#8a8a96]" />
              </button>
            </div>

            <div className="mb-4">
              <span className="mb-2 block text-[12px] uppercase tracking-wider text-[#8a8a96]">
                Color
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ROUTE_COLORS).map(([name, hex]) => (
                  <button
                    key={name}
                    onClick={() => toggleColor(name)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      activeColors.has(name) ? "scale-110 border-white" : "border-transparent opacity-30"
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="mb-2 block text-[12px] uppercase tracking-wider text-[#8a8a96]">
                Grade: V{gradeRange[0]} – V{gradeRange[1]}
              </span>
              <div className="flex gap-2">
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={gradeRange[0]}
                  onChange={(event) =>
                    setGradeRange([
                      Math.min(Number(event.target.value), gradeRange[1]),
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
                  onChange={(event) =>
                    setGradeRange([
                      gradeRange[0],
                      Math.max(Number(event.target.value), gradeRange[0]),
                    ])
                  }
                  className="flex-1 accent-[#a855f7]"
                />
              </div>
              <div className="mt-1 flex justify-between">
                {GRADES.filter((_, index) => index % 2 === 0).map((grade) => (
                  <span key={grade} className="text-[10px] text-[#8a8a96]">
                    {grade}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex-1 overflow-auto">
        {!wall ? (
          <div className="flex h-full items-center justify-center px-8">
            <div className="text-center">
              <p className="text-[16px] text-white/70" style={{ fontWeight: 500 }}>
                Wall not found
              </p>
              <p className="mt-1 text-[13px] text-[#8a8a96]">
                This wall could not be loaded from Supabase.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex min-h-full items-center justify-center px-4 pt-24 pb-28">
            <div className="relative inline-block max-w-full overflow-hidden rounded-[28px] border border-white/8 bg-[#1a1a1f] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
              <ImageFallback
                src={wall.image_url}
                alt={wall.name}
                className="block max-h-[calc(100vh-11rem)] max-w-full select-none object-contain"
                draggable={false}
              />

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />

              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
              >
                {renderableRoutes.flatMap(({ route, polygonPoints }) => {
                  const isSelected = selectedRoute?.id === route.id;
                  const color = ROUTE_COLORS[route.color] || "#8a8a96";
                  const stroke = brightenHex(color, isSelected ? 36 : 20);

                  return polygonPoints.map((points, index) => (
                    <polygon
                      key={`${route.id}-${index}`}
                      points={points}
                      fill={hexToRgba(color, isSelected ? 0.34 : 0.24)}
                      stroke={stroke}
                      strokeWidth={isSelected ? 0.9 : 0.55}
                      strokeLinejoin="round"
                    />
                  ));
                })}
              </svg>

              {renderableRoutes.map(({ route, centroid }) => {
                const isSelected = selectedRoute?.id === route.id;
                const color = ROUTE_COLORS[route.color] || "#8a8a96";

                return (
                  <div
                    key={`${route.id}-glow`}
                    className="pointer-events-none absolute"
                    style={{
                      left: `${(centroid.x * 100).toFixed(2)}%`,
                      top: `${(centroid.y * 100).toFixed(2)}%`,
                      width: `${Math.max(route.region_w * 0.5, 8)}%`,
                      height: `${Math.max(route.region_h * 0.95, 16)}%`,
                      transform: "translate(-50%, -85%)",
                      background: `linear-gradient(to top, ${hexToRgba(color, isSelected ? 0.55 : 0.4)}, transparent)`,
                      filter: "blur(12px)",
                      opacity: isSelected ? 0.34 : 0.2,
                    }}
                  />
                );
              })}

              {renderableRoutes.map(({ route }) => {
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
                    className="absolute overflow-visible rounded-[22px] transition-all duration-200"
                    style={{
                      left: `${route.region_x}%`,
                      top: `${route.region_y}%`,
                      width: `${route.region_w}%`,
                      height: `${route.region_h}%`,
                      backgroundColor: isSelected ? hexToRgba(color, 0.08) : "transparent",
                      boxShadow: isSelected ? `0 0 24px ${hexToRgba(color, 0.2)}` : "none",
                    }}
                    aria-label={`${route.grade} ${route.name || "route"}`}
                  >
                    <div
                      className="absolute top-2 left-2 flex items-center gap-1 rounded-lg px-2 py-0.5 transition-all duration-200"
                      style={{
                        backgroundColor: isSelected ? color : hexToRgba(color, 0.88),
                        boxShadow: isSelected ? `0 0 12px ${hexToRgba(color, 0.6)}` : "none",
                      }}
                    >
                      <span className="text-[12px] text-white" style={{ fontWeight: 700 }}>
                        {route.grade}
                      </span>
                      {statusIcon && <span className="text-[10px] text-white/90">{statusIcon}</span>}
                    </div>
                  </button>
                );
              })}

              {routes.length > 0 && filteredRoutes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center px-8">
                  <div className="rounded-2xl bg-black/55 px-5 py-4 text-center backdrop-blur-md">
                    <p className="text-[16px] text-white/80" style={{ fontWeight: 500 }}>
                      No routes match the current filters
                    </p>
                    <p className="mt-1 text-[12px] text-[#c7c7d1]">
                      Adjust the color or grade range to see more routes.
                    </p>
                  </div>
                </div>
              )}

              {routes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center px-8">
                  <div className="rounded-2xl bg-black/55 px-5 py-4 text-center backdrop-blur-md">
                    <p className="text-[16px] text-white/80" style={{ fontWeight: 500 }}>
                      No routes on this wall yet
                    </p>
                    <p className="mt-1 text-[12px] text-[#c7c7d1]">
                      Routes will appear here once they&apos;re added.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {wall && (
        <div className="pointer-events-none absolute bottom-20 left-0 right-0 z-20 flex justify-center">
          <div className="rounded-full bg-black/60 px-4 py-1.5 backdrop-blur-md">
            <span className="text-[12px] text-white/80" style={{ fontWeight: 500 }}>
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
