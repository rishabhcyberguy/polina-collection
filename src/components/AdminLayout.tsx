import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, LayoutDashboard, LogOut, Package, PanelTop } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { auth as firebaseAuth, onAuthStateChanged, signOut } from "@/lib/firebase";
import { usePageMeta } from "./PolinaLayout";

type AdminIdentity = { id: number; name: string | null; email: string; role: "admin" };

export function AdminGuard({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [firebaseReady, setFirebaseReady] = useState(false);
  useEffect(() => onAuthStateChanged(firebaseAuth, () => setFirebaseReady(true)), []);
  const auth = trpc.auth.me.useQuery(undefined, { enabled: firebaseReady, retry: false, staleTime: 0 });
  usePageMeta("POLINA Admin", "Protected POLINA content management.", true);

  useEffect(() => {
    if (firebaseReady && !auth.isLoading && !auth.data) setLocation("/admin/login");
  }, [auth.data, auth.isLoading, firebaseReady, setLocation]);

  if (!firebaseReady || auth.isLoading) return <main className="admin-loading"><span className="mono-label">VERIFYING FIREBASE ACCOUNT</span><p>One moment…</p></main>;
  if (auth.error || !auth.data) return <main className="admin-loading"><span className="mono-label">REDIRECTING TO SIGN IN</span></main>;
  return <AdminLayout user={auth.data}>{children}</AdminLayout>;
}

export function AdminLayout({ children, user }: { children: ReactNode; user: AdminIdentity }) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut(firebaseAuth);
    } finally {
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      setSigningOut(false);
      setLocation("/admin/login");
    }
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link href="/admin" className="admin-brand"><span>POLINA</span><small>CONTROL ROOM</small></Link>
        <nav aria-label="Admin navigation" className="admin-nav">
          <Link href="/admin"><LayoutDashboard size={15} /> Overview</Link>
          <Link href="/admin/products/new"><Package size={15} /> Products</Link>
          <Link href="/admin/pages"><PanelTop size={15} /> Pages</Link>
        </nav>
        <div className="admin-user"><span>{user.name || user.email}</span><button type="button" className="admin-logout" onClick={() => void handleSignOut()} disabled={signingOut}><LogOut size={15} /> {signingOut ? "Signing out…" : "Sign out"}</button></div>
      </header>
      <div className="admin-main-top"><Link href="/" className="back-link"><ArrowLeft size={14} /> View public site</Link><span className="mono-label">PRIVATE / ADMIN ONLY</span></div>
      {children}
    </div>
  );
}
