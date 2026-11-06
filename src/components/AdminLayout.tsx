import { useEffect, type ReactNode } from "react";
import { ArrowLeft, LayoutDashboard, LogOut, Package, PanelTop } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { usePageMeta } from "./PolinaLayout";

export function AdminGuard({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const auth = trpc.auth.me.useQuery(undefined, { retry: 1, staleTime: 0 });
  usePageMeta("POLINA Admin", "Protected POLINA content management.", true);
  useEffect(() => {
    if (!auth.isLoading && !auth.data) setLocation("/admin/login");
  }, [auth.data, auth.isLoading, setLocation]);
  if (auth.isLoading) return <main className="admin-loading"><span className="mono-label">VERIFYING ADMIN SESSION</span><p>One moment…</p></main>;
  if (auth.error || !auth.data) return <main className="admin-loading"><span className="mono-label">REDIRECTING TO SIGN IN</span></main>;
  return <AdminLayout user={auth.data}>{children}</AdminLayout>;
}

export function AdminLayout({ children, user }: { children: ReactNode; user: { name: string | null; email: string; role: string } }) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const logout = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      try {
        localStorage.removeItem("polina_admin_token");
        localStorage.removeItem("polina_csrf_token");
      } catch {}
      utils.auth.me.setData(undefined, null);
      await utils.auth.me.invalidate();
      setLocation("/admin/login");
    },
  });
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link href="/admin" className="admin-brand"><span>POLINA</span><small>CONTROL ROOM</small></Link>
        <nav aria-label="Admin navigation" className="admin-nav">
          <Link href="/admin"><LayoutDashboard size={15} /> Overview</Link>
          <Link href="/admin/products/new"><Package size={15} /> Products</Link>
          <Link href="/admin/pages"><PanelTop size={15} /> Pages</Link>
        </nav>
        <div className="admin-user"><span>{user.name || user.email}</span><button type="button" className="admin-logout" onClick={() => logout.mutate()} disabled={logout.isPending}><LogOut size={15} /> {logout.isPending ? "Signing out…" : "Sign out"}</button></div>
      </header>
      <div className="admin-main-top"><Link href="/" className="back-link"><ArrowLeft size={14} /> View public site</Link><span className="mono-label">PRIVATE / ADMIN ONLY</span></div>
      {children}
    </div>
  );
}
