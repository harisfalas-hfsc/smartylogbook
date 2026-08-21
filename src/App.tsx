import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicLayout from "./components/PublicLayout";

import Landing from "./pages/Landing";
import AboutPage from "./pages/AboutPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import PricingPage from "./pages/PricingPage";
import TestimonialsPage from "./pages/TestimonialsPage";
import FaqPage from "./pages/FaqPage";
import SecurityPage from "./pages/SecurityPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import DisclaimerPage from "./pages/DisclaimerPage";
import UnsubscribePage from "./pages/UnsubscribePage";

import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// The signed-in application is loaded on demand so first-time visitors only
// download the public marketing site.
const AppShell = lazy(() => import("./components/AppShell"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TimelinePage = lazy(() => import("./pages/TimelinePage"));
const CapturePage = lazy(() => import("./pages/CapturePage"));
const AssistantPage = lazy(() => import("./pages/AssistantPage"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const ModulesPage = lazy(() => import("./pages/ModulesPage"));
const ModuleDetailPage = lazy(() => import("./pages/ModuleDetailPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const TrashPage = lazy(() => import("./pages/TrashPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const PlanPage = lazy(() => import("./pages/PlanPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const PrivacySecurityPage = lazy(() => import("./pages/PrivacySecurityPage"));
const AppearancePage = lazy(() => import("./pages/AppearancePage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const RemindersPage = lazy(() => import("./pages/RemindersPage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const SupportThreadPage = lazy(() => import("./pages/SupportThreadPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));

import NotFound from "./pages/NotFound";
import AnalyticsTracker from "./components/AnalyticsTracker";
import RouteSeo from "./components/RouteSeo";
import SisterAppsPopup from "./components/growth/SisterAppsPopup";
import OfflineBanner from "./components/offline/OfflineBanner";
import OfflineStatus from "./components/offline/OfflineStatus";
import OfflineBootstrap from "./components/offline/OfflineBootstrap";
import OfflineSync from "./components/offline/OfflineSync";
import UpdatePrompt from "./components/offline/UpdatePrompt";
import { HelmetProvider } from "react-helmet-async";

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);


const queryClient = new QueryClient();

const AuthEntry = () => {
  const location = useLocation();

  // A direct browser or installed-app launch must always open the public home page.
  // The sign-in screen remains available through in-app navigation.
  if (location.key === "default") {
    return <Navigate to="/" replace />;
  }

  return <AuthPage />;
};

// A cold launch (browser or installed app) of a signed-in user opens the dashboard.
// Navigating to Home from inside the app still shows the public landing page.
const HomeEntry = () => {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (location.key === "default") {
    if (loading) return null;
    if (user) return <Navigate to="/app" replace />;
  }

  return <Landing />;
};

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RouteSeo />
          <AnalyticsTracker />
          <OfflineBootstrap />
          <OfflineSync />
          <OfflineBanner />
          <OfflineStatus />
          <UpdatePrompt />
          <Suspense fallback={<RouteFallback />}>
          <Routes>

            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomeEntry />} />
              <Route path="/index" element={<Navigate to="/" replace />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/features" element={<Navigate to="/about" replace />} />
              <Route path="/community" element={<Navigate to="/" replace />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/testimonials" element={<TestimonialsPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/support" element={<Navigate to="/contact" replace />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-and-conditions" element={<TermsPage />} />
              <Route path="/disclaimer" element={<DisclaimerPage />} />
              <Route path="/unsubscribe" element={<UnsubscribePage />} />

            </Route>
            <Route path="/auth" element={<AuthEntry />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="timeline" element={<TimelinePage />} />
              <Route path="capture" element={<CapturePage />} />
              <Route path="assistant" element={<AssistantPage />} />
              <Route path="coach" element={<Navigate to="/app/assistant" replace />} />
              <Route path="ai" element={<Navigate to="/app/assistant" replace />} />
              <Route path="search" element={<Navigate to="/app/timeline" replace />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="categories" element={<ModulesPage />} />
              <Route path="modules" element={<Navigate to="/app/categories" replace />} />
              <Route path="category/:id" element={<ModuleDetailPage />} />
              <Route path="module/:id" element={<ModuleDetailPage />} />
              <Route path="reminders" element={<RemindersPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="support/:id" element={<SupportThreadPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="trash" element={<TrashPage />} />
              <Route path="account" element={<AccountPage />} />
              <Route path="plan" element={<PlanPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="privacy" element={<PrivacySecurityPage />} />
              <Route path="appearance" element={<AppearancePage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>

          <SisterAppsPopup />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
