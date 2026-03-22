import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "./stores/authStore";
import { useSocketStore } from "./stores/socketStore";
import AppLayout from "./components/layout/AppLayout";
import { Spinner } from "./components/ui/Loader";

// Lazy-loaded pages
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const MissionsPage = lazy(() => import("./pages/MissionsPage"));
const AssetsPage = lazy(() => import("./pages/AssetsPage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
  const token = useAuthStore((s) => s.token);
  const verifyToken = useAuthStore((s) => s.verifyToken);
  const loading = useAuthStore((s) => s.loading);
  const initSocket = useSocketStore((s) => s.initSocket);

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  useEffect(() => {
    if (token) initSocket(token);
  }, [token, initSocket]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <Spinner />
      </div>
    );
  }

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="missions" element={<MissionsPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
