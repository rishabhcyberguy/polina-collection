import { useCallback, useEffect, useState } from "react";
import { auth as firebaseAuth, onAuthStateChanged, signOut } from "@/lib/firebase";
import { trpc } from "@/lib/trpc";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const [firebaseReady, setFirebaseReady] = useState(false);
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: firebaseReady,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => onAuthStateChanged(firebaseAuth, () => setFirebaseReady(true)), []);

  const logout = useCallback(async () => {
    await signOut(firebaseAuth);
    utils.auth.me.setData(undefined, null);
    await utils.auth.me.invalidate();
  }, [utils]);

  useEffect(() => {
    if (!redirectOnUnauthenticated || !firebaseReady || meQuery.isLoading || meQuery.data) return;
    if (typeof window === "undefined") return;
    const destination = redirectPath || "/admin/login";
    if (window.location.pathname !== destination) window.location.assign(destination);
  }, [firebaseReady, meQuery.data, meQuery.isLoading, redirectOnUnauthenticated, redirectPath]);

  return {
    user: meQuery.data ?? null,
    loading: !firebaseReady || meQuery.isLoading,
    error: meQuery.error ?? null,
    isAuthenticated: Boolean(meQuery.data),
    refresh: () => meQuery.refetch(),
    logout,
  };
}
