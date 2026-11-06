import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Link, useLocation } from "wouter";
import { usePageMeta } from "@/components/PolinaLayout";
import { trpc } from "@/lib/trpc";
import { auth as firebaseAuth, googleProvider, signInWithPopup } from "@/lib/firebase";

export function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const auth = trpc.auth.me.useQuery(undefined, { retry: false });

  // If already logged in, redirect to admin panel
  useEffect(() => {
    if (auth.data) {
      setLocation("/admin");
    }
  }, [auth.data, setLocation]);

  const onLoginSuccess = async (data: { id: number; name: string | null; email: string; role: "admin"; token?: string; csrf?: string }) => {
    if (data?.token) {
      try {
        localStorage.setItem("polina_admin_token", data.token);
      } catch {}
    }
    if (data?.csrf) {
      try {
        localStorage.setItem("polina_csrf_token", data.csrf);
      } catch {}
    }
    utils.auth.me.setData(undefined, { id: data.id, name: data.name, email: data.email, role: data.role });
    await utils.auth.me.invalidate();
    setLocation("/admin");
  };

  const login = trpc.auth.signIn.useMutation({
    onSuccess: onLoginSuccess,
  });

  const firebaseLogin = trpc.auth.firebaseSignIn.useMutation({
    onSuccess: onLoginSuccess,
  });

  usePageMeta("Admin sign in — POLINA", "Sign in to manage POLINA content.", true);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate({ email, password });
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      setGoogleError(null);
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      if (result.user?.email) {
        await firebaseLogin.mutateAsync({ email: result.user.email });
      }
    } catch (err) {
      setGoogleError(err instanceof Error ? err.message : "Google sign in could not be completed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const isPending = login.isPending || firebaseLogin.isPending || googleLoading;

  return (
    <main className="auth-screen">
      <Link href="/" className="auth-back"><ArrowLeft size={15} /> Back to POLINA</Link>
      <section className="auth-card">
        <span className="mono-label">POLINA / PRIVATE ACCESS</span>
        <h1><LockKeyhole size={25} aria-hidden="true" /> Admin sign in</h1>
        <p>Private administrator portal for POLINA management. Public registration is permanently disabled.</p>

        {/* Google / Firebase Authentication Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isPending}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            minHeight: "46px",
            padding: "0 16px",
            background: "#ffffff",
            border: "1px solid var(--ink)",
            color: "var(--ink)",
            fontSize: "11px",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            cursor: isPending ? "not-allowed" : "pointer",
            marginBottom: "18px",
            transition: "background 0.2s ease, transform 0.2s ease",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.41 7.34 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.59 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          {googleLoading ? "Connecting with Google…" : "Sign in with Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "16px 0", color: "#8a847c", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          <span style={{ flex: 1, height: "1px", background: "var(--line)" }} />
          <span>Or enter administrator password</span>
          <span style={{ flex: 1, height: "1px", background: "var(--line)" }} />
        </div>

        <form onSubmit={submit} className="admin-form">
          <label>Email address<input type="email" name="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@polina.com" /></label>
          <label>Password<input type="password" name="password" autoComplete="current-password" required minLength={1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {login.error ? <p className="form-error" role="alert">{login.error.message}</p> : null}
          {firebaseLogin.error ? <p className="form-error" role="alert">{firebaseLogin.error.message}</p> : null}
          {googleError ? <p className="form-error" role="alert">{googleError}</p> : null}
          <button className="button-red button-red--wide" type="submit" disabled={isPending}>{isPending ? "Authenticating…" : "Sign in"}</button>
        </form>
        <Link className="auth-secondary-link" href="/admin/reset">Forgot password?</Link>
      </section>
    </main>
  );
}
