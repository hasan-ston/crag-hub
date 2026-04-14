import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Plus,
  Upload,
  Trash2,
  Image as ImageIcon,
  Loader2,
  X,
  Eye,
  EyeOff,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { ROUTE_COLORS, GRADES } from "@/lib/constants";
import { ImageFallback } from "@/components/image-fallback";
import {
  getBoundingBoxFromPaths,
  normalizeStoredRoutePath,
  simplifyRoutePath,
} from "@/lib/route-path";
import type { Point, RoutePath, RoutePathCollection } from "@/lib/types";

type AdminView = "walls" | "add-wall" | "wall-routes" | "add-route";

interface WallForm {
  id: string;
  name: string;
  display_order: number;
}

interface RouteForm {
  grade: string;
  color: string;
  name: string;
  setter: string;
  paths: RoutePathCollection;
  region_x: number;
  region_y: number;
  region_w: number;
  region_h: number;
}

const INITIAL_WALL: WallForm = { id: "", name: "", display_order: 0 };
const INITIAL_ROUTE: RouteForm = {
  grade: "V0",
  color: "green",
  name: "",
  setter: "",
  paths: [],
  region_x: 10,
  region_y: 10,
  region_w: 20,
  region_h: 30,
};

function getDraftBounds(paths: RoutePathCollection) {
  if (paths.length === 0) {
    return {
      region_x: INITIAL_ROUTE.region_x,
      region_y: INITIAL_ROUTE.region_y,
      region_w: INITIAL_ROUTE.region_w,
      region_h: INITIAL_ROUTE.region_h,
    };
  }

  return getBoundingBoxFromPaths(paths);
}

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

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  path: RoutePath,
  color: string,
  width: number,
  height: number,
  options?: { closed?: boolean; fillAlpha?: number; lineWidth?: number }
) {
  if (path.length === 0) {
    return;
  }

  ctx.beginPath();
  ctx.moveTo(path[0].x * width, path[0].y * height);

  for (let i = 1; i < path.length; i += 1) {
    ctx.lineTo(path[i].x * width, path[i].y * height);
  }

  if (options?.closed !== false && path.length >= 3) {
    ctx.closePath();
  }

  ctx.strokeStyle = hexToRgba(color, 0.95);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = options?.lineWidth ?? 2.5;

  if (options?.closed !== false && path.length >= 3) {
    ctx.fillStyle = hexToRgba(color, options?.fillAlpha ?? 0.26);
    ctx.fill();
  }

  ctx.stroke();
}

export function AdminScreen() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const {
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
  } = useAdmin();

  const [view, setView] = useState<AdminView>("walls");
  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [wallForm, setWallForm] = useState<WallForm>(INITIAL_WALL);
  const [routeForm, setRouteForm] = useState<RouteForm>(INITIAL_ROUTE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawScale, setDrawScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wallImageRef = useRef<HTMLImageElement>(null);
  const drawingPointerIdRef = useRef<number | null>(null);
  const livePathRef = useRef<RoutePath>([]);

  const selectedWall = walls.find((wall) => wall.id === selectedWallId);
  const selectedWallRoutes = routes.filter((route) => route.wall_id === selectedWallId);
  const totalDraftPoints = routeForm.paths.reduce((sum, path) => sum + path.length, 0);

  useEffect(() => {
    if (selectedWallId) {
      loadRoutes(selectedWallId);
    }
  }, [selectedWallId, loadRoutes]);

  const showFeedback = useCallback((message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(null), 3000);
  }, []);

  const drawPreview = useCallback(
    (activePath?: RoutePath) => {
      const canvas = canvasRef.current;
      const image = wallImageRef.current;

      if (!canvas || !image) {
        return;
      }

      const rect = image.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);

      if (
        canvas.width !== Math.round(width * dpr) ||
        canvas.height !== Math.round(height * dpr)
      ) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      for (const savedPath of routeForm.paths) {
        drawPolygon(
          ctx,
          savedPath,
          ROUTE_COLORS[routeForm.color] || "#8a8a96",
          width,
          height,
          {
            closed: true,
            fillAlpha: 0.28,
            lineWidth: 2.5,
          }
        );
      }

      if (activePath && activePath.length > 0) {
        drawPolygon(
          ctx,
          activePath,
          ROUTE_COLORS[routeForm.color] || "#8a8a96",
          width,
          height,
          {
            closed: !isDrawing && activePath.length >= 3,
            fillAlpha: isDrawing ? 0.14 : 0.22,
            lineWidth: isDrawing ? 2 : 2.5,
          }
        );
      }
    },
    [isDrawing, routeForm.color, routeForm.paths]
  );

  useEffect(() => {
    if (view !== "add-route") {
      return;
    }

    drawPreview();

    const image = wallImageRef.current;
    if (!image || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => drawPreview());
    observer.observe(image);

    return () => observer.disconnect();
  }, [drawPreview, drawScale, view]);

  const resetRouteDraft = useCallback(() => {
    livePathRef.current = [];
    drawingPointerIdRef.current = null;
    setIsDrawing(false);
    setDrawScale(1);
    setRouteForm(INITIAL_ROUTE);
  }, []);

  const undoLastRoutePath = useCallback(() => {
    setRouteForm((current) => {
      const nextPaths = current.paths.slice(0, -1);
      return {
        ...current,
        paths: nextPaths,
        ...getDraftBounds(nextPaths),
      };
    });
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreateWall = async () => {
    if (!wallForm.name.trim() || !imageFile) {
      showFeedback("Name and image are required.");
      return;
    }

    setUploading(true);

    const slug =
      wallForm.id.trim() ||
      wallForm.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const imageUrl = await uploadWallImage(imageFile);
    if (!imageUrl) {
      showFeedback("Image upload failed.");
      setUploading(false);
      return;
    }

    const ok = await createWall({
      id: slug,
      name: wallForm.name.trim(),
      image_url: imageUrl,
      display_order: wallForm.display_order,
    });

    setUploading(false);

    if (ok) {
      showFeedback(`Wall "${wallForm.name}" created.`);
      setWallForm(INITIAL_WALL);
      setImageFile(null);
      setImagePreview(null);
      setView("walls");
    } else {
      showFeedback("Failed to create wall. ID might already exist.");
    }
  };

  const handleDeleteWall = async (wallId: string) => {
    await deleteWall(wallId);
    showFeedback("Wall deleted.");
    if (selectedWallId === wallId) {
      setSelectedWallId(null);
      setView("walls");
    }
  };

  const handleCreateRoute = async () => {
    if (!selectedWallId || routeForm.paths.length === 0) {
      showFeedback("Draw at least one route region before saving.");
      return;
    }

    setUploading(true);

    const result = await createRoute({
      wall_id: selectedWallId,
      grade: routeForm.grade,
      color: routeForm.color,
      name: routeForm.name.trim() || null,
      setter: routeForm.setter.trim() || null,
      path: routeForm.paths,
      region_x: routeForm.region_x,
      region_y: routeForm.region_y,
      region_w: routeForm.region_w,
      region_h: routeForm.region_h,
    });

    setUploading(false);

    if (result.ok) {
      showFeedback("Route added.");
      resetRouteDraft();
      setView("wall-routes");
    } else if (result.error?.includes("column routes.path does not exist")) {
      showFeedback("Run the route path migration first. The database does not have routes.path yet.");
    } else {
      showFeedback("Failed to create route.");
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!selectedWallId) {
      return;
    }

    await deleteRoute(routeId, selectedWallId);
    showFeedback("Route deleted.");
  };

  const handleToggleActive = async (routeId: string, active: boolean) => {
    if (!selectedWallId) {
      return;
    }

    await toggleRouteActive(routeId, active, selectedWallId);
  };

  const getNormalizedPoint = useCallback((event: React.PointerEvent<HTMLCanvasElement>): Point | null => {
    const image = wallImageRef.current;
    if (!image) {
      return null;
    }

    const rect = image.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return null;
    }

    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  }, []);

  const finishDrawing = useCallback(() => {
    const rawPath = livePathRef.current;
    livePathRef.current = [];
    drawingPointerIdRef.current = null;
    setIsDrawing(false);

    if (rawPath.length < 3) {
      drawPreview();
      showFeedback("Draw a closed shape around the route.");
      return;
    }

    const simplifiedPath = simplifyRoutePath(rawPath, 40);
    setRouteForm((current) => {
      const nextPaths = [...current.paths, simplifiedPath];
      return {
        ...current,
        paths: nextPaths,
        ...getDraftBounds(nextPaths),
      };
    });
  }, [drawPreview, showFeedback]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview, routeForm.paths]);

  const handleCanvasPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    const point = getNormalizedPoint(event);
    if (!point) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);

    drawingPointerIdRef.current = event.pointerId;
    livePathRef.current = [point];
    setIsDrawing(true);
    drawPreview([point]);
  };

  const handleCanvasPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || drawingPointerIdRef.current !== event.pointerId) {
      return;
    }

    const point = getNormalizedPoint(event);
    if (!point) {
      return;
    }

    event.preventDefault();

    const currentPath = livePathRef.current;
    const lastPoint = currentPath[currentPath.length - 1];

    if (lastPoint) {
      const dx = point.x - lastPoint.x;
      const dy = point.y - lastPoint.y;
      if (Math.hypot(dx, dy) < 0.0035) {
        return;
      }
    }

    livePathRef.current = [...currentPath, point];
    drawPreview(livePathRef.current);
  };

  const handleCanvasPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawingPointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();

    const point = getNormalizedPoint(event);
    const currentPath = livePathRef.current;
    const lastPoint = currentPath[currentPath.length - 1];

    if (
      point &&
      (!lastPoint || Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) >= 0.0035)
    ) {
      livePathRef.current = [...currentPath, point];
    }

    finishDrawing();
  };

  const handleCanvasPointerCancel = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawingPointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    livePathRef.current = [];
    drawingPointerIdRef.current = null;
    setIsDrawing(false);
    drawPreview();
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a1f] px-6">
        <div className="w-full max-w-sm rounded-2xl border border-[#333340] bg-[#232329] p-6 text-center">
          <h1 className="text-[20px] text-white" style={{ fontWeight: 700 }}>
            Admin Only
          </h1>
          <p className="mt-2 text-[14px] text-[#8a8a96]">
            This screen is only available to the configured admin account.
          </p>
          <button
            onClick={() => navigate("/profile")}
            className="mt-5 w-full rounded-xl bg-[#a855f7] py-3 text-[14px] text-white"
            style={{ fontWeight: 600 }}
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a1f]">
        <Loader2 size={28} className="animate-spin text-[#a855f7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1f] pb-8">
      {feedback && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-[#a855f7] px-5 py-2.5 shadow-lg">
          <span className="text-[13px] text-white" style={{ fontWeight: 600 }}>
            {feedback}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button
          onClick={() => {
            if (view === "walls") {
              navigate("/");
            } else if (view === "wall-routes" || view === "add-wall") {
              setView("walls");
              setSelectedWallId(null);
            } else if (view === "add-route") {
              resetRouteDraft();
              setView("wall-routes");
            }
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2a2a32]"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h1 className="text-[22px] text-white" style={{ fontWeight: 700 }}>
          {view === "walls" && "Admin"}
          {view === "add-wall" && "Add Wall"}
          {view === "wall-routes" && (selectedWall?.name || "Routes")}
          {view === "add-route" && "Draw Route"}
        </h1>
      </div>

      {view === "walls" && (
        <div className="px-5">
          <button
            onClick={() => {
              setWallForm(INITIAL_WALL);
              setImageFile(null);
              setImagePreview(null);
              setView("add-wall");
            }}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#a855f7] py-3 text-[14px] text-white transition-all active:scale-[0.98]"
            style={{ fontWeight: 600 }}
          >
            <Plus size={18} /> Add Wall
          </button>

          {walls.length === 0 ? (
            <div className="py-16 text-center">
              <ImageIcon size={36} className="mx-auto mb-2 text-[#333340]" />
              <p className="text-[14px] text-[#8a8a96]">No walls yet. Add your first wall above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {walls.map((wall) => (
                <div
                  key={wall.id}
                  className="flex items-center gap-3 rounded-xl border border-[#333340]/50 bg-[#232329] p-3"
                >
                  <ImageFallback
                    src={wall.image_url}
                    alt={wall.name}
                    className="h-16 w-16 shrink-0 rounded-lg bg-[#19191f] object-contain p-1"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] text-white" style={{ fontWeight: 600 }}>
                      {wall.name}
                    </p>
                    <p className="text-[12px] text-[#8a8a96]">ID: {wall.id}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedWallId(wall.id);
                        setView("wall-routes");
                      }}
                      className="rounded-lg bg-[#2a2a32] px-3 py-2 text-[12px] text-white"
                      style={{ fontWeight: 500 }}
                    >
                      Routes
                    </button>
                    <button
                      onClick={() => handleDeleteWall(wall.id)}
                      className="rounded-lg bg-[#ef4444]/10 p-2"
                    >
                      <Trash2 size={14} className="text-[#ef4444]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "add-wall" && (
        <div className="space-y-4 px-5">
          <div>
            <label className="mb-1.5 block text-[12px] uppercase tracking-wider text-[#8a8a96]">
              Wall Photo *
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative overflow-hidden rounded-xl">
                <img src={imagePreview} alt="Preview" className="h-48 w-full bg-[#19191f] object-contain" />
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#333340] bg-[#232329] py-10 transition-colors hover:border-[#a855f7]"
              >
                <Upload size={28} className="text-[#8a8a96]" />
                <span className="text-[13px] text-[#8a8a96]">Tap to upload wall photo</span>
              </button>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] uppercase tracking-wider text-[#8a8a96]">
              Wall Name *
            </label>
            <input
              type="text"
              value={wallForm.name}
              onChange={(event) => setWallForm({ ...wallForm, name: event.target.value })}
              placeholder="e.g. Overhang"
              className="w-full rounded-xl border border-[#333340] bg-[#2a2a32] px-4 py-3 text-[14px] text-white placeholder:text-[#666] focus:border-[#a855f7] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] uppercase tracking-wider text-[#8a8a96]">
              Slug (auto-generated if empty)
            </label>
            <input
              type="text"
              value={wallForm.id}
              onChange={(event) => setWallForm({ ...wallForm, id: event.target.value })}
              placeholder={
                wallForm.name ? wallForm.name.toLowerCase().replace(/\s+/g, "-") : "overhang"
              }
              className="w-full rounded-xl border border-[#333340] bg-[#2a2a32] px-4 py-3 text-[14px] text-white placeholder:text-[#666] focus:border-[#a855f7] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] uppercase tracking-wider text-[#8a8a96]">
              Display Order
            </label>
            <input
              type="number"
              value={wallForm.display_order}
              onChange={(event) =>
                setWallForm({ ...wallForm, display_order: Number.parseInt(event.target.value, 10) || 0 })
              }
              className="w-full rounded-xl border border-[#333340] bg-[#2a2a32] px-4 py-3 text-[14px] text-white focus:border-[#a855f7] focus:outline-none"
            />
          </div>

          <button
            onClick={handleCreateWall}
            disabled={uploading || !wallForm.name.trim() || !imageFile}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#a855f7] py-3.5 text-[15px] text-white transition-all disabled:opacity-40 active:scale-[0.98]"
            style={{ fontWeight: 600 }}
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {uploading ? "Uploading…" : "Create Wall"}
          </button>
        </div>
      )}

      {view === "wall-routes" && selectedWall && (
        <div className="px-5">
          <div className="mb-4 overflow-hidden rounded-xl">
            <ImageFallback
              src={selectedWall.image_url}
              alt={selectedWall.name}
              className="h-36 w-full bg-[#19191f] object-contain"
            />
          </div>

          <button
            onClick={() => {
              resetRouteDraft();
              setView("add-route");
            }}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#a855f7] py-3 text-[14px] text-white transition-all active:scale-[0.98]"
            style={{ fontWeight: 600 }}
          >
            <Pencil size={18} /> Draw Route
          </button>

          {selectedWallRoutes.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[14px] text-[#8a8a96]">No routes on this wall yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedWallRoutes.map((route) => (
                <div
                  key={route.id}
                  className="flex items-center gap-3 rounded-xl border border-[#333340]/50 bg-[#232329] p-3"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: ROUTE_COLORS[route.color] || "#8a8a96" }}
                  >
                    <span className="text-[13px] text-white" style={{ fontWeight: 800 }}>
                      {route.grade}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] text-white" style={{ fontWeight: 500 }}>
                      {route.name || "Unnamed"}
                    </p>
                    <p className="text-[11px] text-[#8a8a96]">
                      {route.setter || "No setter"} · {route.color} · {normalizeStoredRoutePath(route.path).length} regions
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => handleToggleActive(route.id, !route.active)}
                      className="rounded-lg bg-[#2a2a32] p-2"
                      title={route.active ? "Deactivate" : "Activate"}
                    >
                      {route.active ? (
                        <Eye size={14} className="text-[#22c55e]" />
                      ) : (
                        <EyeOff size={14} className="text-[#8a8a96]" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteRoute(route.id)}
                      className="rounded-lg bg-[#ef4444]/10 p-2"
                    >
                      <Trash2 size={14} className="text-[#ef4444]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "add-route" && selectedWall && (
        <div className="space-y-4 px-5">
          <div className="rounded-2xl border border-[#333340] bg-[#232329] p-3">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[14px] text-white" style={{ fontWeight: 600 }}>
                  Draw directly on the wall photo
                </p>
                <p className="mt-1 text-[12px] text-[#8a8a96]">
                  Use touch or Apple Pencil. Each new drawing is added to the same route, so you can outline multiple sections before saving.
                </p>
              </div>
              {routeForm.paths.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={undoLastRoutePath}
                    className="flex items-center gap-1 rounded-lg bg-[#2a2a32] px-3 py-2 text-[12px] text-white"
                    style={{ fontWeight: 500 }}
                  >
                    <X size={14} /> Undo Last
                  </button>
                  <button
                    onClick={resetRouteDraft}
                    className="flex items-center gap-1 rounded-lg bg-[#2a2a32] px-3 py-2 text-[12px] text-white"
                    style={{ fontWeight: 500 }}
                  >
                    <RotateCcw size={14} /> Clear All
                  </button>
                </div>
              )}
            </div>

            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[12px] uppercase tracking-wider text-[#8a8a96]">
                Canvas Zoom
              </span>
              <span className="text-[12px] text-white">{Math.round(drawScale * 100)}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={drawScale}
              onChange={(event) => setDrawScale(Number(event.target.value))}
              className="mb-4 w-full accent-[#a855f7]"
            />

            <div className="overflow-auto rounded-xl bg-[#111115]">
              <div
                className="relative"
                style={{ width: `${Math.max(drawScale * 100, 100)}%` }}
              >
                <ImageFallback
                  ref={wallImageRef}
                  src={selectedWall.image_url}
                  alt={selectedWall.name}
                  className="block w-full select-none object-contain"
                  draggable={false}
                  onLoad={() => drawPreview()}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 h-full w-full"
                  style={{ touchAction: "none" }}
                  onPointerDown={handleCanvasPointerDown}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={handleCanvasPointerUp}
                  onPointerCancel={handleCanvasPointerCancel}
                />

                {routeForm.paths.length === 0 && !isDrawing && (
                  <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-xl bg-black/55 px-4 py-2 text-center backdrop-blur-sm">
                    <span className="text-[12px] text-white/90" style={{ fontWeight: 500 }}>
                      Start drawing around the route area
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {routeForm.paths.length > 0 && (
            <>
              <div className="rounded-2xl border border-[#333340] bg-[#232329] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px] uppercase tracking-wider text-[#8a8a96]">
                    Route Details
                  </span>
                  <span className="rounded-full bg-[#2a2a32] px-2.5 py-1 text-[11px] text-white">
                    {routeForm.paths.length} regions · {totalDraftPoints} points
                  </span>
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-[12px] uppercase tracking-wider text-[#8a8a96]">
                    Grade *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GRADES.map((grade) => (
                      <button
                        key={grade}
                        onClick={() => setRouteForm({ ...routeForm, grade })}
                        className={`rounded-lg px-3 py-2 text-[13px] transition-all ${
                          routeForm.grade === grade
                            ? "bg-[#a855f7] text-white"
                            : "bg-[#2a2a32] text-[#8a8a96]"
                        }`}
                        style={{ fontWeight: routeForm.grade === grade ? 700 : 500 }}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="mb-1.5 block text-[12px] uppercase tracking-wider text-[#8a8a96]">
                    Hold Color *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ROUTE_COLORS).map(([name, hex]) => (
                      <button
                        key={name}
                        onClick={() => setRouteForm({ ...routeForm, color: name })}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] transition-all ${
                          routeForm.color === name ? "ring-2 ring-white" : "opacity-60"
                        }`}
                        style={{
                          backgroundColor: hex,
                          fontWeight: 600,
                          color: name === "white" || name === "yellow" ? "#000" : "#fff",
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-[12px] uppercase tracking-wider text-[#8a8a96]">
                      Route Name
                    </label>
                    <input
                      type="text"
                      value={routeForm.name}
                      onChange={(event) => setRouteForm({ ...routeForm, name: event.target.value })}
                      placeholder="e.g. Crimson Dyno"
                      className="w-full rounded-xl border border-[#333340] bg-[#2a2a32] px-4 py-3 text-[14px] text-white placeholder:text-[#666] focus:border-[#a855f7] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[12px] uppercase tracking-wider text-[#8a8a96]">
                      Setter
                    </label>
                    <input
                      type="text"
                      value={routeForm.setter}
                      onChange={(event) => setRouteForm({ ...routeForm, setter: event.target.value })}
                      placeholder="e.g. Alex M."
                      className="w-full rounded-xl border border-[#333340] bg-[#2a2a32] px-4 py-3 text-[14px] text-white placeholder:text-[#666] focus:border-[#a855f7] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#333340] bg-[#232329] p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[13px] uppercase tracking-wider text-[#8a8a96]">
                    Bounding Box Fallback
                  </span>
                  <span className="text-[11px] text-[#8a8a96]">Used for quick hit detection</span>
                </div>
                <p className="text-[12px] text-[#8a8a96]">
                  x {routeForm.region_x}% · y {routeForm.region_y}% · w {routeForm.region_w}% · h {routeForm.region_h}%
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetRouteDraft}
                  className="flex-1 rounded-xl border border-[#333340] bg-[#2a2a32] py-3 text-[14px] text-white"
                  style={{ fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoute}
                  disabled={uploading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#a855f7] py-3 text-[14px] text-white transition-all disabled:opacity-40"
                  style={{ fontWeight: 600 }}
                >
                  {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {uploading ? "Saving…" : "Save Route"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
