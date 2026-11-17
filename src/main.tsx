import { trpc } from "@/lib/trpc";
import { auth as firebaseAuth } from "@/lib/firebase";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, httpLink, splitLink } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import "./index.css";
import { uploadProgressFetch } from "@/lib/upload-progress";

if (typeof window !== "undefined") {
  const resizeObserverErrRegex = /ResizeObserver loop (limit exceeded|completed with undelivered notifications)/i;
  window.addEventListener("error", (event) => {
    if (event.message && resizeObserverErrRegex.test(event.message)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);
  window.addEventListener("unhandledrejection", (event) => {
    const msg = event.reason?.message || String(event.reason);
    if (msg && resizeObserverErrRegex.test(msg)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
    mutations: { retry: 0 },
  },
});

async function getAuthHeaders() {
  const token = await firebaseAuth.currentUser?.getIdToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}

const trpcClient = trpc.createClient({
  links: [splitLink({
    condition: (operation) => operation.path === "admin.uploadProductImage",
    true: httpLink({
      url: "/api/trpc",
      transformer: superjson,
      headers: getAuthHeaders,
      fetch: uploadProgressFetch,
    }),
    false: httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers: getAuthHeaders,
    }),
  })],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>,
);
