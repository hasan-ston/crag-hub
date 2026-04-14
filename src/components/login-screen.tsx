import { useState } from "react";
import { Mountain, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function LoginScreen() {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setEmailLoading(true);
    setError(null);

    const result = await signInWithEmail(email.trim());
    setEmailLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setEmailSent(true);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1a1a1f] px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#a855f7]">
            <Mountain size={32} className="text-white" />
          </div>
          <h1
            className="text-[28px] text-white"
            style={{ fontWeight: 800, lineHeight: 1.2 }}
          >
            Crag Climbing
          </h1>
          <p className="mt-1.5 text-[14px] text-[#8a8a96]">
            McMaster Climbing Gym
          </p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3.5 transition-transform active:scale-[0.98]"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          <span
            className="text-[15px] text-[#1a1a1f]"
            style={{ fontWeight: 600 }}
          >
            Continue with Google
          </span>
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#333340]" />
          <span className="text-[12px] text-[#8a8a96] uppercase tracking-wider">
            or
          </span>
          <div className="h-px flex-1 bg-[#333340]" />
        </div>

        {emailSent ? (
          <div className="rounded-xl bg-[#232329] border border-[#333340] px-4 py-5 text-center">
            <Mail size={24} className="mx-auto mb-2 text-[#a855f7]" />
            <p
              className="text-[15px] text-white"
              style={{ fontWeight: 600 }}
            >
              Check your email
            </p>
            <p className="mt-1 text-[13px] text-[#8a8a96]">
              We sent a sign-in link to {email}
            </p>
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit}>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a8a96]"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-xl border border-[#333340] bg-[#2a2a32] py-3 pl-10 pr-4 text-[14px] text-white placeholder:text-[#666] focus:border-[#a855f7] focus:outline-none"
              />
            </div>
            {error && (
              <p className="mt-2 text-[12px] text-[#ef4444]">{error}</p>
            )}
            <button
              type="submit"
              disabled={emailLoading || !email.trim()}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#a855f7] py-3 text-[15px] text-white transition-all disabled:opacity-40 active:scale-[0.98]"
              style={{ fontWeight: 600 }}
            >
              {emailLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Send magic link"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
