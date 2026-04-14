import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { parseGradeNumber } from "@/lib/constants";

interface SessionStats {
  todaySends: number;
  weekSends: number;
  highestGrade: string;
  totalSends: number;
  totalFlashes: number;
  totalProjects: number;
  weeklyActivity: { day: string; sends: number }[];
  gradeDistribution: { grade: string; count: number; color: string }[];
  recentSends: { name: string; grade: string; color: string; when: string }[];
}

const GRADE_COLORS: Record<number, string> = {
  0: "#22c55e", 1: "#22c55e", 2: "#22c55e",
  3: "#eab308", 4: "#eab308",
  5: "#f97316", 6: "#ef4444",
  7: "#ef4444", 8: "#a855f7",
  9: "#a855f7", 10: "#a855f7",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getStartOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getStartOfWeek(date: Date): Date {
  const d = getStartOfDay(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function useSessionStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<SessionStats>({
    todaySends: 0,
    weekSends: 0,
    highestGrade: "—",
    totalSends: 0,
    totalFlashes: 0,
    totalProjects: 0,
    weeklyActivity: DAY_NAMES.map((d) => ({ day: d, sends: 0 })),
    gradeDistribution: [],
    recentSends: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function load() {
      const { data: logs } = await supabase
        .from("logs")
        .select("*, routes(grade, color, name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (!logs || logs.length === 0) {
        setLoading(false);
        return;
      }

      const now = new Date();
      const todayStart = getStartOfDay(now);
      const weekStart = getStartOfWeek(now);

      let todaySends = 0;
      let weekSends = 0;
      let highestNum = -1;
      let totalFlashes = 0;
      let totalProjects = 0;
      const completedLogs = logs.filter(
        (l) => l.log_type === "flash" || l.log_type === "send"
      );

      const gradeCounts: Record<string, number> = {};
      const weekDays: Record<string, number> = {};
      DAY_NAMES.forEach((d) => (weekDays[d] = 0));

      for (const log of logs) {
        const ts = new Date(log.created_at);
        const route = log.routes as { grade: string; color: string; name: string | null } | null;
        const gradeNum = route ? parseGradeNumber(route.grade) : 0;

        if (log.log_type === "flash") totalFlashes++;
        if (log.log_type === "project") totalProjects++;

        if (log.log_type !== "project") {
          if (ts >= todayStart) todaySends++;
          if (ts >= weekStart) {
            weekSends++;
            weekDays[DAY_NAMES[ts.getDay()]]++;
          }
          if (gradeNum > highestNum) highestNum = gradeNum;

          const g = route?.grade || "V0";
          gradeCounts[g] = (gradeCounts[g] || 0) + 1;
        }
      }

      const gradeDistribution = Object.entries(gradeCounts)
        .sort((a, b) => parseGradeNumber(a[0]) - parseGradeNumber(b[0]))
        .map(([grade, count]) => ({
          grade,
          count,
          color: GRADE_COLORS[parseGradeNumber(grade)] || "#8a8a96",
        }));

      const recentSends = completedLogs.slice(0, 5).map((log) => {
        const route = log.routes as { grade: string; color: string; name: string | null } | null;
        const ts = new Date(log.created_at);
        const isToday = ts >= todayStart;
        return {
          name: route?.name || "Unnamed",
          grade: route?.grade || "?",
          color: route?.color || "#8a8a96",
          when: isToday ? "Today" : ts.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        };
      });

      setStats({
        todaySends,
        weekSends,
        highestGrade: highestNum >= 0 ? `V${highestNum}` : "—",
        totalSends: completedLogs.length,
        totalFlashes,
        totalProjects,
        weeklyActivity: DAY_NAMES.map((d) => ({ day: d, sends: weekDays[d] })),
        gradeDistribution,
        recentSends,
      });
      setLoading(false);
    }

    load();
  }, [user]);

  return { stats, loading };
}
