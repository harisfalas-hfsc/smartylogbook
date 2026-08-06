import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import PublicLayout from "./components/PublicLayout";
import Landing from "./pages/Landing";
import AboutPage from "./pages/AboutPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import PricingPage from "./pages/PricingPage";
import TestimonialsPage from "./pages/TestimonialsPage";
import FaqPage from "./pages/FaqPage";
import SecurityPage from "./pages/SecurityPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import DisclaimerPage from "./pages/DisclaimerPage";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Dashboard from "./pages/Dashboard";
import TimelinePage from "./pages/TimelinePage";
import CapturePage from "./pages/CapturePage";
import AiPage from "./pages/AiPage";
import AssistantPage from "./pages/AssistantPage";
import InsightsPage from "./pages/InsightsPage";
import ModulesPage from "./pages/ModulesPage";
import ModuleDetailPage from "./pages/ModuleDetailPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import TrashPage from "./pages/TrashPage";
import AdminPage from "./pages/AdminPage";
import AccountPage from "./pages/AccountPage";
import PlanPage from "./pages/PlanPage";
import CheckoutPage from "./pages/CheckoutPage";
import PrivacySecurityPage from "./pages/PrivacySecurityPage";
import AppearancePage from "./pages/AppearancePage";
import CalendarPage from "./pages/CalendarPage";
import RemindersPage from "./pages/RemindersPage";
import MessagesPage from "./pages/MessagesPage";
import OnboardingPage from "./pages/OnboardingPage";
import NotFound from "./pages/NotFound";
import AnalyticsTracker from "./components/AnalyticsTracker";
import RouteSeo from "./components/RouteSeo";
import { HelmetProvider } from "react-helmet-async";

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
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/index" element={<Navigate to="/" replace />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/features" element={<Navigate to="/about" replace />} />
              <Route path="/community" element={<Navigate to="/" replace />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/testimonials" element={<TestimonialsPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
              <Route path="/terms-and-conditions" element={<TermsPage />} />
              <Route path="/disclaimer" element={<DisclaimerPage />} />
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
              <Route path="ai" element={<AiPage />} />
              <Route path="search" element={<AiPage />} />
              <Route path="insights" element={<InsightsPage />} />
              <Route path="categories" element={<ModulesPage />} />
              <Route path="modules" element={<Navigate to="/app/categories" replace />} />
              <Route path="module/:id" element={<ModuleDetailPage />} />
              <Route path="reminders" element={<RemindersPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="messages" element={<MessagesPage />} />
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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
