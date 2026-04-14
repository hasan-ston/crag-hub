import { useNavigate } from "react-router";
import { ChevronRight, Flame, Mountain } from "lucide-react";
import { useWalls } from "@/hooks/use-walls";
import { useSessionStats } from "@/hooks/use-session-stats";
import { ImageFallback } from "@/components/image-fallback";

export function HomeScreen() {
  const navigate = useNavigate();
  const { walls, loading: wallsLoading } = useWalls();
  const { stats } = useSessionStats();

  return (
    <div className="min-h-screen bg-[#1a1a1f] pb-24">
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-[#8a8a96] tracking-wide uppercase">
              {new Date().toLocaleDateString("en-US", { weekday: "long" })} Session
            </p>
            <h1
              className="text-[28px] text-white mt-0.5"
              style={{ fontWeight: 700, lineHeight: 1.2 }}
            >
              Crag Climbing
            </h1>
          </div>
          {stats.todaySends > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#2a2a32] px-3 py-1.5">
              <Flame size={14} className="text-orange-400" />
              <span
                className="text-[13px] text-white"
                style={{ fontWeight: 600 }}
              >
                {stats.todaySends} today
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 px-5 mb-5">
        {[
          { label: "Today", value: `${stats.todaySends} sends` },
          { label: "This week", value: `${stats.weekSends} sends` },
          { label: "Highest", value: stats.highestGrade },
        ].map((stat) => (
          <div key={stat.label} className="flex-1 rounded-xl bg-[#232329] px-3 py-3">
            <p className="text-[11px] text-[#8a8a96] uppercase tracking-wider">
              {stat.label}
            </p>
            <p
              className="text-[15px] text-white mt-0.5"
              style={{ fontWeight: 600 }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-5 mb-3">
        <h2 className="text-[17px] text-white" style={{ fontWeight: 600 }}>
          Walls
        </h2>
        <button
          className="flex items-center gap-0.5 text-[13px] text-[#a855f7]"
          style={{ fontWeight: 500 }}
        >
          View all <ChevronRight size={14} />
        </button>
      </div>

      {wallsLoading ? (
        <div className="grid grid-cols-2 gap-3 px-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-[#232329] animate-pulse"
              style={{ aspectRatio: "4/5" }}
            />
          ))}
        </div>
      ) : walls.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-5 py-16">
          <Mountain size={40} className="text-[#333340] mb-3" />
          <p className="text-[14px] text-[#8a8a96]" style={{ fontWeight: 500 }}>
            No walls added yet
          </p>
          <p className="text-[12px] text-[#666] mt-1">
            Walls will appear here once an admin adds them.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-5">
          {walls.map((wall) => (
            <button
              key={wall.id}
              onClick={() => navigate(`/wall/${wall.id}`)}
              className="group relative overflow-hidden rounded-2xl bg-[#232329] text-left"
              style={{ aspectRatio: "4/5" }}
            >
              <ImageFallback
                src={wall.image_url}
                alt={wall.name}
                className="absolute inset-0 h-full w-full bg-[#19191f] p-2 object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3
                  className="text-[15px] text-white"
                  style={{ fontWeight: 600 }}
                >
                  {wall.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[12px] text-[#8a8a96]">
                    {wall.routeCount} routes
                  </span>
                  {wall.newRoutes > 0 && (
                    <span
                      className="rounded-full bg-[#a855f7] px-2 py-0.5 text-[10px] text-white"
                      style={{ fontWeight: 600 }}
                    >
                      {wall.newRoutes} new
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
