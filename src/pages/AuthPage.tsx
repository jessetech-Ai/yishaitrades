import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Lock, Mail, Shield, TrendingUp, Zap } from "lucide-react";
import type { AuthSession } from "../lib/auth";
import { googleCredentialLogin, googleDemoLogin, login, register } from "../lib/auth";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, string | number | boolean>) => void;
        };
      };
    };
  }
}

export const AuthPage = ({ onAuthenticated }: { onAuthenticated: (session: AuthSession, password?: string) => void }) => {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;
    const render = () => {
      if (!window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response) => {
          try {
            const session = googleCredentialLogin(response.credential);
            onAuthenticated(session);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Google sign-in failed.");
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        type: "standard",
        text: "continue_with",
        width: 340,
      });
    };

    if (window.google) { render(); return; }
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    const script = existing || document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = render;
    if (!existing) document.body.appendChild(script);
  }, [googleClientId, onAuthenticated]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const session = mode === "signup"
        ? register(email, password, displayName)
        : login(email, password);
      onAuthenticated(session, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    }
  };

  const googleLogin = () => {
    const session = googleDemoLogin();
    onAuthenticated(session);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_0.95fr] bg-[#0a0e1a] text-white">
      <section className="relative overflow-hidden flex items-center px-6 md:px-12 py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.24),transparent_34%),radial-gradient(circle_at_75%_20%,rgba(139,92,246,0.18),transparent_28%),radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.12),transparent_30%)]" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200 mb-6">
            <Zap size={13} /> YishaiEdge Trading Journal
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.02]">
            Turn every trade into measurable edge.
          </h1>
          <p className="mt-5 text-lg text-[#a3acc0] max-w-xl">
            Log trades fast, review your psychology, track performance, and find what actually works across forex, stocks, and crypto.
          </p>
          <div className="mt-8 grid sm:grid-cols-3 gap-3 max-w-xl">
            <div className="border border-[#1f2a3d] rounded-xl p-4 bg-white/[0.03]">
              <TrendingUp className="text-emerald-400 mb-2" size={18} />
              <div className="font-semibold text-sm">Performance-first</div>
              <div className="text-xs text-[#8b94a8] mt-1">Win rate, PF, drawdown, expectancy.</div>
            </div>
            <div className="border border-[#1f2a3d] rounded-xl p-4 bg-white/[0.03]">
              <Shield className="text-indigo-300 mb-2" size={18} />
              <div className="font-semibold text-sm">Local-first demo</div>
              <div className="text-xs text-[#8b94a8] mt-1">Your data stays in this browser.</div>
            </div>
            <div className="border border-[#1f2a3d] rounded-xl p-4 bg-white/[0.03]">
              <Lock className="text-amber-300 mb-2" size={18} />
              <div className="font-semibold text-sm">Account gate</div>
              <div className="text-xs text-[#8b94a8] mt-1">Email/password sign-in flow.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 border-l border-[#1f2a3d] bg-[#0c1220]/70">
        <div className="card w-full max-w-md p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap size={19} />
            </div>
            <div>
              <h2 className="font-semibold text-xl">{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
              <p className="text-xs text-[#8b94a8]">{mode === "signup" ? "Start journaling in under a minute." : "Sign in to continue your review."}</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <div>
                <label className="label">Display Name</label>
                <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Yishai" />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b94a8]" />
                <input type="email" className="input !pl-9" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b94a8]" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="input !pl-9 !pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  required
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b94a8] hover:text-white" onClick={() => setShowPassword((s) => !s)}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {error && <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-lg px-3 py-2">{error}</div>}
            <button className="btn btn-primary w-full justify-center" type="submit">
              {mode === "signup" ? "Create Account" : "Sign In"}
            </button>
          </form>

          {googleClientId ? (
            <div className="mt-3 flex justify-center" ref={googleButtonRef} />
          ) : (
            <button className="btn btn-ghost w-full justify-center mt-3" onClick={googleLogin}>
              Continue with Google (demo)
            </button>
          )}

          <div className="mt-5 text-center text-sm text-[#8b94a8]">
            {mode === "signup" ? "Already have an account?" : "New to YishaiEdge?"}{" "}
            <button className="text-indigo-300 hover:text-indigo-200" onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }}>
              {mode === "signup" ? "Sign in" : "Create account"}
            </button>
          </div>

          <div className="mt-5 text-[11px] text-[#8b94a8] leading-relaxed">
            {googleClientId
              ? "Google Identity Services is configured from VITE_GOOGLE_CLIENT_ID. Verify ID tokens on your backend before production use."
              : "Google demo mode is active. Add VITE_GOOGLE_CLIENT_ID to enable the real Google button."}
          </div>
        </div>
      </section>
    </div>
  );
};