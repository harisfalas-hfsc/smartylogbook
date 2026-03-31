import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import CategoriesPage from "./pages/CategoriesPage";
import InsightsPage from "./pages/InsightsPage";
import ProfilePage from "./pages/ProfilePage";
import CategoryPage from "./pages/CategoryPage";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AccountPage from "./pages/AccountPage";
import NotificationsPage from "./pages/NotificationsPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import HelpPage from "./pages/HelpPage";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";
import AppHeader from "./components/AppHeader";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppHeader />
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
            <Route path="/insights" element={<ProtectedRoute><InsightsPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/category/:id" element={<ProtectedRoute><CategoryPage /></ProtectedRoute>} />
            <Route path="/profile/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
            <Route path="/profile/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
            <Route path="/profile/privacy" element={<ProtectedRoute><PrivacyPage /></ProtectedRoute>} />
            <Route path="/profile/terms" element={<ProtectedRoute><TermsPage /></ProtectedRoute>} />
            <Route path="/profile/help" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
