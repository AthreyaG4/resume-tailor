import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  Navigate,
} from "react-router";
import { LandingPage } from "./pages/Landing";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ResumeProvider } from "./context/ResumeContext.jsx";
import { ApplicationsProvider } from "./context/ApplicationsContext.jsx";
import { Toaster } from "./components/ui/sonner.jsx";
import Layout from "./components/layout";
import Dashboard from "./pages/Dashboard.jsx";
import { useAuth } from "./hooks/useAuth";
import { Loader2 } from "lucide-react";
import { NotFoundPage } from "./pages/NotFound.jsx";
import ResumePage from "./pages/Resume.jsx";
import ApplicationDetail from "./pages/ApplicationDetail.jsx";

function PublicRoute({ children }) {
  const { user, isLoading } = useAuth();
  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/20" />
      </div>
    );
  if (user) return <Navigate to="/dashboard" />;
  return children;
}

function ProtectedLayout() {
  const { user, isLoading } = useAuth();
  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/20" />
      </div>
    );
  if (!user) return <Navigate to="/" />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <PublicRoute>
        <LandingPage />
      </PublicRoute>
    ),
  },
  {
    path: "/login",
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: "/signup",
    element: (
      <PublicRoute>
        <SignupPage />
      </PublicRoute>
    ),
  },
  {
    element: <ProtectedLayout />,
    children: [
      { path: "/dashboard", Component: Dashboard },
      { path: "/resume", Component: ResumePage },
      { path: "/applications/:id", Component: ApplicationDetail },
    ],
  },
  {
    path: "*",
    Component: NotFoundPage,
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <ResumeProvider>
        <ApplicationsProvider>
          <Toaster />
          <RouterProvider router={router} />
        </ApplicationsProvider>
      </ResumeProvider>
    </AuthProvider>
  );
}
