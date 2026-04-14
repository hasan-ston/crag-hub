import { Home, Mountain, BarChart3, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router";

const TABS = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Mountain, label: "Walls", path: "/walls" },
  { icon: BarChart3, label: "Stats", path: "/stats" },
  { icon: User, label: "Profile", path: "/profile" },
] as const;

export function NavBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#333340] bg-[#1a1a1f]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {TABS.map((tab) => {
          const active =
            pathname === tab.path ||
            (tab.path === "/walls" && pathname.startsWith("/wall"));

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 transition-colors ${
                active
                  ? "text-[#a855f7]"
                  : "text-[#8a8a96] hover:text-[#c0c0cc]"
              }`}
            >
              <tab.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
              <span
                className={`text-[10px] tracking-wide ${active ? "text-[#a855f7]" : ""}`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
