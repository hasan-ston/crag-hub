import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LoginScreen } from "@/components/login-screen";
import { Loader2 } from "lucide-react";

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a1f]">
        <Loader2 size={28} className="animate-spin text-[#a855f7]" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
