import { useState, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { Link } from "wouter";
import { usePageMeta } from "@/components/PolinaLayout";
import { auth as firebaseAuth, sendPasswordResetEmail } from "@/lib/firebase";

export function PasswordResetRequestPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  usePageMeta("Password recovery — POLINA", "Request a POLINA admin password reset.", true);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim(), {
        url: `${window.location.origin}/admin/login?reset=success`,
        handleCodeInApp: false,
      });
    } catch (reason) {
      const code = (reason as { code?: string }).code;
      if (code !== "auth/user-not-found" && code !== "auth/invalid-credential") {
        setError("Reset instructions could not be sent. Confirm this site is an authorized Firebase domain and try again.");
      }
    } finally {
      setSubmitted(true);
      setPending(false);
    }
  };

  return (
    <main className="auth-screen">
      <Link href="/admin/login" className="auth-back"><ArrowLeft size={15} /> Back to sign in</Link>
      <section className="auth-card">
        <span className="mono-label">POLINA / ACCOUNT RECOVERY</span>
        <h1><KeyRound size={25} aria-hidden="true" /> Reset password</h1>
        {submitted ? <div className="reset-confirmation" role="status"><CheckCircle2 size={22} /><p>If an account exists for that email, Firebase has sent a secure reset link. Follow the link in your inbox to choose a new password.</p></div> : <>
          <p>Enter the administrator email. For account privacy, the confirmation is the same whether or not the address is registered.</p>
          <form onSubmit={submit} className="admin-form">
            <label>Email address<input type="email" name="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button className="button-red button-red--wide" type="submit" disabled={pending}>{pending ? "Sending…" : "Request reset link"}</button>
          </form>
        </>}
      </section>
    </main>
  );
}

export function PasswordResetFormPage() {
  usePageMeta("Password reset — POLINA", "Complete a password reset through Firebase Auth.", true);
  return (
    <main className="auth-screen">
      <Link href="/admin/login" className="auth-back"><ArrowLeft size={15} /> Back to sign in</Link>
      <section className="auth-card">
        <span className="mono-label">POLINA / ACCOUNT RECOVERY</span>
        <h1><KeyRound size={25} aria-hidden="true" /> Secure password reset</h1>
        <p>Password changes are handled by Firebase Auth using a one-time email link. Request a new link if the email has expired.</p>
        <Link className="auth-secondary-link" href="/admin/reset">Request another reset link</Link>
      </section>
    </main>
  );
}
