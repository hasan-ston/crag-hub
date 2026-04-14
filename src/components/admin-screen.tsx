import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Plus,
  Upload,
  Trash2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAdmin } from "@/hooks/use-admin";
import { ROUTE_COLORS, GRADES } from "@/lib/constants";
import { ImageFallback } from "@/components/image-fallback";

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
  region_x: 10,
  region_y: 10,
  region_w: 20,
  region_h: 30,
};

export function AdminScreen() {
  const navigate = useNavigate();
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedWall = walls.find((w) => w.id === selectedWallId);

  useEffect(() => {
    if (selectedWallId) {
      loadRoutes(selectedWallId);
    }
  }, [selectedWallId, loadRoutes]);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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

    const slug = wallForm.id.trim() || wallForm.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

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
    if (!selectedWallId) return;

    setUploading(true);

    const ok = await createRoute({
      wall_id: selectedWallId,
      grade: routeForm.grade,
      color: routeForm.color,
      name: routeForm.name.trim() || null,
      setter: routeForm.setter.trim() || null,
      region_x: routeForm.region_x,
      region_y: routeForm.region_y,
      region_w: routeForm.region_w,
      region_h: routeForm.region_h,
    });

    setUploading(false);

    if (ok) {
      showFeedback("Route added.");
      setRouteForm(INITIAL_ROUTE);
      setView("wall-routes");
    } else {
      showFeedback("Failed to create route.");
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!selectedWallId) return;
    await deleteRoute(routeId, selectedWallId);
    showFeedback("Route deleted.");
  };

  const handleToggleActive = async (routeId: string, active: boolean) => {
    if (!selectedWallId) return;
    await toggleRouteActive(routeId, active, selectedWallId);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a1f]">
        <Loader2 size={28} className="animate-spin text-[#a855f7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1f] pb-8">
      {/* Feedback toast */}
      {feedback && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-[#a855f7] px-5 py-2.5 shadow-lg">
          <span className="text-[13px] text-white" style={{ fontWeight: 600 }}>
            {feedback}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button
          onClick={() => {
            if (view === "walls") {
              navigate("/");
            } else if (view === "wall-routes" || view === "add-wall") {
              setView("walls");
              setSelectedWallId(null);
            } else if (view === "add-route") {
              setView("wall-routes");
            }
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2a2a32]"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <h1 className="text-[22px] text-white" style={{ fontWeight: 700+0 }}>
          {view === "walls" && "Admin"}
          {view === "add-wall" && "Add Wall"}
          {view === "wall-routes" && (selectedWall?.name || "Routes")}
          {view === "add-route" && "Add Route"}
        </h1>
      </div>

      {/* ─── WALLS LIST ─── */}
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
                  className="flex items-center gap-3 rounded-xl bg-[#232329] border border-[#333340]/50 p-3"
                >
                  <ImageFallback
                    src={wall.image_url}
                    alt={wall.name}
                    className="h-16 w-16 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] text-white truncate" style={{ fontWeight: 600 }}>
                      {wall.name}
                    </p>
                    <p className="text-[12px] text-[#8a8a96]">ID: {wall.id}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
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

      {/* ─── ADD WALL ─── */}
      {view === "add-wall" && (
        <div className="px-5 space-y-4">
          {/* Image upload */}
          <div>
            <label className="mb-1.5 block text-[12px] text-[#8a8a96] uppercase tracking-wider">
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
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />
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
                <span className="text-[13px] text-[#8a8a96]">
                  Tap to upload wall photo
                </span>
              </button>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-[12px] text-[#8a8a96] uppercase tracking-wider">
              Wall Name *
            </label>
            <input
              type="text"
              value={wallForm.name}
              onChange={(e) => setWallForm({ ...wallForm, name: e.target.value })}
              placeholder="e.g. Overhang"
              className="w-full rounded-xl border border-[#333340] bg-[#2a2a32] px-4 py-3 text-[14px] text-white placeholder:text-[#666] focus:border-[#a855f7] focus:outline-none"
            />
          </div>

          {/* Slug (optional) */}
          <div>
            <label className="mb-1.5 block text-[12px] text-[#8a8a96] uppercase tracking-wider">
              Slug (auto-generated if empty)
            </label>
            <input
              type="text"
              value={wallForm.id}
              onChange={(e) => setWallForm({ ...wallForm, id: e.target.value })}
              placeholder={wallForm.name ? wallForm.name.toLowerCase().replace(/\s+/g, "-") : "overhang"}
              className="w-full rounded-xl border border-[#333340] bg-[#2a2a32] px-4 py-3 text-[14px] text-white placeholder:text-[#666] focus:border-[#a855f7] focus:outline-none"
            />
          </div>

          {/* Display Order */}
          <div>
            <label className="mb-1.5 block text-[12px] text-[#8a8a96] uppercase tracking-wider">
              Display Order
            </label>
            <input
              type="number"
              value={wallForm.display_order}
              onChange={(e) =>
                setWallForm({ ...wallForm, display_order: parseInt(e.target.value) || 0 })
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

      {/* ─── WALL ROUTES ─── */}
      {view === "wall-routes" && selectedWall && (
        <div className="px-5">
          {/* Wall preview */}
          <div className="mb-4 rounded-xl overflow-hidden">
            <ImageFallback
              src={selectedWall.image_url}
              alt={selectedWall.name}
              className="w-full h-36 object-cover"
            />
          </div>

          <button
            onClick={() => {
              setRouteForm(INITIAL_ROUTE);
              setView("add-route");
            }}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#a855f7] py-3 text-[14px] text-white transition-all active:scale-[0.98]"
            style={{ fontWeight: 600 }}
          >
            <Plus size={18} /> Add Route
          </button>

          {routes.filter((r) => r.wall_id === selectedWallId).length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[14px] text-[#8a8a96]">No routes on this wall yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {routes
                .filter((r) => r.wall_id === selectedWallId)
                .map((route) => (
                  <div
                    key={route.id}
                    className="flex items-center gap-3 rounded-xl bg-[#232329] border border-[#333340]/50 p-3"
                  >
                    <div
                      className="h-10 w-10 rounded-lg shrink-0 flex items-center justify-center"
                      style={{ backgroundColor: ROUTE_COLORS[route.color] || "#8a8a96" }}
                    >
                      <span className="text-[13px] text-white" style={{ fontWeight: 800 }}>
                        {route.grade}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] text-white truncate" style={{ fontWeight: 500 }}>
                        {route.name || "Unnamed"}
                      </p>
                      <p className="text-[11px] text-[#8a8a96]">
                        {route.setter || "No setter"} · {route.color} ·{" "}
                        ({route.region_x}, {route.region_y}, {route.region_w}×{route.region_h})
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
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

      {/* ─── ADD ROUTE ─── */}
      {view === "add-route" && selectedWall && (
        <div className="px-5 space-y-4">
          {/* Grade */}
          <div>
            <label className="mb-1.5 block text-[12px] text-[#8a8a96] uppercase tracking-wider">
              Grade *
            </label>
            <div className="flex flex-wrap gap-2">
              {GRADES.map((g) => (
                <button
                  key={g}
                  onClick={() => setRouteForm({ ...routeForm, grade: g })}
                  className={`rounded-lg px-3 py-2 text-[13px] transition-all ${
                    routeForm.grade === g
                      ? "bg-[#a855f7] text-white"
                      : "bg-[#2a2a32] text-[#8a8a96]"
                  }`}
                  style={{ fontWeight: routeForm.grade === g ? 700 : 500 }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="mb-1.5 block text-[12px] text-[#8a8a96] uppercase tracking-wider">
              Hold Color *
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ROUTE_COLORS).map(([name, hex]) => (
                <button
                  key={name}
                  onClick={() => setRouteForm({ ...routeForm, color: name })}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] transition-all ${
                    routeForm.color === name
                      ? "ring-2 ring-white"
                      : "opacity-60"
                  }`}
                  style={{ backgroundColor: hex, fontWeight: 600, color: name === "white" || name === "yellow" ? "#000" : "#fff" }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="mb-1.5 block text-[12px] text-[#8a8a96] uppercase tracking-wider">
              Route Name
            </label>
            <input
              type="text"
              value={routeForm.name}
              onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
              placeholder="e.g. Crimson Dyno"
              className="w-full rounded-xl border border-[#333340] bg-[#2a2a32] px-4 py-3 text-[14px] text-white placeholder:text-[#666] focus:border-[#a855f7] focus:outline-none"
            />
          </div>

          {/* Setter */}
          <div>
            <label className="mb-1.5 block text-[12px] text-[#8a8a96] uppercase tracking-wider">
              Setter
            </label>
            <input
              type="text"
              value={routeForm.setter}
              onChange={(e) => setRouteForm({ ...routeForm, setter: e.target.value })}
              placeholder="e.g. Alex M."
              className="w-full rounded-xl border border-[#333340] bg-[#2a2a32] px-4 py-3 text-[14px] text-white placeholder:text-[#666] focus:border-[#a855f7] focus:outline-none"
            />
          </div>

          {/* Position */}
          <div>
            <label className="mb-1.5 block text-[12px] text-[#8a8a96] uppercase tracking-wider">
              Position on Wall (% from top-left)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "region_x" as const, label: "X %" },
                { key: "region_y" as const, label: "Y %" },
                { key: "region_w" as const, label: "Width %" },
                { key: "region_h" as const, label: "Height %" },
              ].map((field) => (
                <div key={field.key}>
                  <span className="text-[11px] text-[#8a8a96]">{field.label}</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={routeForm[field.key]}
                    onChange={(e) =>
                      setRouteForm({
                        ...routeForm,
                        [field.key]: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-[#333340] bg-[#2a2a32] px-3 py-2 text-[14px] text-white focus:border-[#a855f7] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="mb-1.5 block text-[12px] text-[#8a8a96] uppercase tracking-wider">
              Preview
            </label>
            <div className="relative rounded-xl overflow-hidden bg-[#111115]" style={{ height: 200 }}>
              <ImageFallback
                src={selectedWall.image_url}
                alt={selectedWall.name}
                className="absolute inset-0 w-full h-full object-cover opacity-60"
              />
              <div
                className="absolute rounded-lg border-2"
                style={{
                  left: `${routeForm.region_x}%`,
                  top: `${routeForm.region_y}%`,
                  width: `${routeForm.region_w}%`,
                  height: `${routeForm.region_h}%`,
                  backgroundColor: `${ROUTE_COLORS[routeForm.color] || "#888"}30`,
                  borderColor: ROUTE_COLORS[routeForm.color] || "#888",
                }}
              >
                <div
                  className="absolute top-1 left-1 rounded px-1.5 py-0.5"
                  style={{ backgroundColor: ROUTE_COLORS[routeForm.color] || "#888" }}
                >
                  <span className="text-[10px] text-white" style={{ fontWeight: 700 }}>
                    {routeForm.grade}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateRoute}
            disabled={uploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#a855f7] py-3.5 text-[15px] text-white transition-all disabled:opacity-40 active:scale-[0.98]"
            style={{ fontWeight: 600 }}
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {uploading ? "Saving…" : "Add Route"}
          </button>
        </div>
      )}
    </div>
  );
}
