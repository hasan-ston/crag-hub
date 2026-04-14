import { TrendingUp, Award, Flame, Calendar, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { useSessionStats } from "@/hooks/use-session-stats";
import { ROUTE_COLORS } from "@/lib/constants";

export function StatsScreen() {
  const { stats, loading } = useSessionStats();

  const today = new Date().toLocaleDateString("en-US", { weekday: "short" });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1f] pb-24">
        <div className="px-5 pt-14 pb-2">
          <h1
            className="text-[28px] text-white"
            style={{ fontWeight: 700, lineHeight: 1.2 }}
          >
            Stats
          </h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <p className="text-[14px] text-[#8a8a96]">Loading stats…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1f] pb-24">
      <div className="px-5 pt-14 pb-2">
        <h1
          className="text-[28px] text-white"
          style={{ fontWeight: 700, lineHeight: 1.2 }}
        >
          Stats
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 mt-4">
        {[
          { icon: TrendingUp, label: "Total Sends", value: String(stats.totalSends), color: "#22c55e" },
          { icon: Award, label: "Highest Grade", value: stats.highestGrade, color: "#a855f7" },
          { icon: Flame, label: "Flashes", value: String(stats.totalFlashes), color: "#f97316" },
          { icon: Calendar, label: "Projects", value: String(stats.totalProjects), color: "#3b82f6" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-[#232329] p-4 border border-[#333340]/50"
          >
            <stat.icon size={18} style={{ color: stat.color }} />
            <p
              className="text-[24px] text-white mt-2"
              style={{ fontWeight: 800, lineHeight: 1 }}
            >
              {stat.value}
            </p>
            <p className="text-[12px] text-[#8a8a96] mt-1 uppercase tracking-wider">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {stats.weeklyActivity.some((d) => d.sends > 0) && (
        <div className="px-5 mt-6">
          <h3
            className="text-[15px] text-white mb-3"
            style={{ fontWeight: 600 }}
          >
            This Week
          </h3>
          <div className="rounded-2xl bg-[#232329] border border-[#333340]/50 p-4">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={stats.weeklyActivity} barCategoryGap="30%">
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8a8a96", fontSize: 11 }}
                />
                <YAxis hide />
                <Bar dataKey="sends" radius={[6, 6, 0, 0]}>
                  {stats.weeklyActivity.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.day === today ? "#a855f7" : "#333340"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {stats.gradeDistribution.length > 0 && (
        <div className="px-5 mt-6">
          <h3
            className="text-[15px] text-white mb-3"
            style={{ fontWeight: 600 }}
          >
            Grade Distribution
          </h3>
          <div className="rounded-2xl bg-[#232329] border border-[#333340]/50 p-4">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart
                data={stats.gradeDistribution}
                barCategoryGap="20%"
              >
                <XAxis
                  dataKey="grade"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#8a8a96", fontSize: 10 }}
                />
                <YAxis hide />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {stats.gradeDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {stats.recentSends.length > 0 && (
        <div className="px-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3
              className="text-[15px] text-white"
              style={{ fontWeight: 600 }}
            >
              Recent Sends
            </h3>
            <button
              className="flex items-center gap-0.5 text-[13px] text-[#a855f7]"
              style={{ fontWeight: 500 }}
            >
              All <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-2">
            {stats.recentSends.map((send, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-[#232329] border border-[#333340]/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ROUTE_COLORS[send.color] || send.color }}
                  />
                  <span
                    className="text-[14px] text-white"
                    style={{ fontWeight: 500 }}
                  >
                    {send.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-[#8a8a96]">
                    {send.when}
                  </span>
                  <span
                    className="text-[14px] text-white"
                    style={{ fontWeight: 700 }}
                  >
                    {send.grade}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.totalSends === 0 && (
        <div className="flex flex-col items-center justify-center px-5 py-16">
          <p
            className="text-[14px] text-[#8a8a96]"
            style={{ fontWeight: 500 }}
          >
            No sends yet
          </p>
          <p className="text-[12px] text-[#666] mt-1">
            Start logging climbs to see your stats here.
          </p>
        </div>
      )}
    </div>
  );
}
