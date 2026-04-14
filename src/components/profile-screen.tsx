import { Settings, LogOut, Bell, Moon, HelpCircle, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSessionStats } from "@/hooks/use-session-stats";

export function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const { stats } = useSessionStats();

  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="min-h-screen bg-[#1a1a1f] pb-24">
      <div className="px-5 pt-14 pb-6">
        <h1
          className="text-[28px] text-white"
          style={{ fontWeight: 700, lineHeight: 1.2 }}
        >
          Profile
        </h1>
      </div>

      <div className="flex items-center gap-4 px-5 mb-6">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#a855f7] flex items-center justify-center">
            <span
              className="text-[24px] text-white"
              style={{ fontWeight: 800 }}
            >
              {initials}
            </span>
          </div>
        )}
        <div>
          <h2
            className="text-[18px] text-white"
            style={{ fontWeight: 700 }}
          >
            {profile?.display_name || "Climber"}
          </h2>
          {profile?.created_at && (
            <p className="text-[13px] text-[#8a8a96]">
              Member since{" "}
              {new Date(profile.created_at).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
          )}
          {stats.highestGrade !== "—" && (
            <div className="flex items-center gap-1 mt-1">
              <div className="rounded-full bg-[#22c55e]/20 px-2 py-0.5">
                <span
                  className="text-[11px] text-[#22c55e]"
                  style={{ fontWeight: 600 }}
                >
                  {stats.highestGrade} Climber
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-5 rounded-2xl bg-[#232329] border border-[#333340]/50 p-4 mb-6">
        <p
          className="text-[12px] text-[#8a8a96] uppercase tracking-wider mb-3"
          style={{ fontWeight: 600 }}
        >
          All Time
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Sends", value: String(stats.totalSends) },
            { label: "Flashes", value: String(stats.totalFlashes) },
            { label: "Projects", value: String(stats.totalProjects) },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p
                className="text-[22px] text-white"
                style={{ fontWeight: 800 }}
              >
                {s.value}
              </p>
              <p className="text-[11px] text-[#8a8a96] uppercase tracking-wider">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 space-y-1">
        {[
          { icon: Bell, label: "Notifications", action: undefined },
          { icon: Moon, label: "Appearance", action: undefined },
          { icon: Settings, label: "Settings", action: undefined },
          { icon: HelpCircle, label: "Help & Feedback", action: undefined },
          { icon: LogOut, label: "Sign Out", danger: true, action: signOut },
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className={`flex items-center justify-between w-full rounded-xl px-4 py-3.5 transition-colors hover:bg-[#232329] ${
              "danger" in item && item.danger
                ? "text-[#ef4444]"
                : "text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon
                size={18}
                className={
                  "danger" in item && item.danger
                    ? "text-[#ef4444]"
                    : "text-[#8a8a96]"
                }
              />
              <span className="text-[14px]" style={{ fontWeight: 500 }}>
                {item.label}
              </span>
            </div>
            <ChevronRight size={16} className="text-[#8a8a96]" />
          </button>
        ))}
      </div>
    </div>
  );
}
