import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { Link, useLocation, useSearch } from "wouter";
import { usePageMeta } from "@/components/PolinaLayout";
import { trpc } from "@/lib/trpc";
import {
  auth as firebaseAuth,
  googleProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "@/lib/firebase";

export function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const utils = trpc.useUtils();
  const auth = trpc.auth.me.useQuery(undefined, { enabled: firebaseReady, retry: false });
  const firebaseLogin = trpc.auth.firebaseSignIn.useMutation();
  const resetCompleted = new URLSearchParams(search).get("reset") === "success";

  useEffect(() => onAuthStateChanged(firebaseAuth, () => setFirebaseReady(true)), []);
  useEffect(() => {
    if (auth.data) setLocation("/admin");
  }, [auth.data, setLocation]);

  usePageMeta("Admin sign in — POLINA", "Sign in to manage POLINA content.", true);

  const finishAdminSignIn = async () => {
    try {
      const result = await firebaseLogin.mutateAsync();
      utils.auth.me.setData(undefined, result);
      await utils.auth.me.invalidate();
      setLocation("/admin");
    } catch (error) {
      await signOut(firebaseAuth).catch(() => undefined);
      const message = error instanceof Error ? error.message : "This Firebase account is not authorized for POLINA administration.";
      setAuthError(message);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setAuthError(null);
    setPasswordLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        await signOut(firebaseAuth);
        setAuthError("Verify your email using the message we sent before signing in.");
        return;
      }
      await finishAdminSignIn();
    } catch (error) {
      await signOut(firebaseAuth).catch(() => undefined);
      const code = (error as { code?: string }).code;
      setAuthError(code?.startsWith("auth/") ? "Email or password was not accepted." : error instanceof Error ? error.message : "Sign-in could not be completed.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setGoogleLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      if (!result.user.emailVerified) {
        await sendEmailVerification(result.user);
        await signOut(firebaseAuth);
        setAuthError("Verify your email using the message we sent before signing in.");
        return;
      }
      await finishAdminSignIn();
    } catch (error) {
      await signOut(firebaseAuth).catch(() => undefined);
      setAuthError(error instanceof Error ? error.message : "Google sign in could not be completed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const isPending = passwordLoading || googleLoading || firebaseLogin.isPending;

  return (
    <main className="auth-screen">
      <Link href="/" className="auth-back"><ArrowLeft size={15} /> Back to POLINA</Link>
      <section className="auth-card">
        <span className="mono-label">POLINA / PRIVATE ACCESS</span>
        <h1><LockKeyhole size={25} aria-hidden="true" /> Admin sign in</h1>
        <p>Private administrator portal for POLINA management. Public registration is permanently disabled.</p>
        {resetCompleted ? <p className="reset-confirmation" role="status">Your password reset is complete. Sign in with your updated password.</p> : null}

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
          {authError ? <p className="form-error" role="alert">{authError}</p> : null}
          <button className="button-red button-red--wide" type="submit" disabled={isPending}>{isPending ? "Authenticating…" : "Sign in"}</button>
        </form>
        <Link className="auth-secondary-link" href="/admin/reset">Forgot password?</Link>
      </section>
    </main>
  );
}
