import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Bell, Search, Sparkles } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import Logo from '@/components/Logo';
import { MORE_LINKS, NAV_TABS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/lib/preferences';
import { useNotificationEngine } from '@/lib/reminders';

const AppShell = () => {
  const { pathname } = useLocation();
  const { profile, user } = useAuth();
  const { prefs, loading: prefsLoading } = usePreferences();
  useNotificationEngine(prefs);
  const initial = (profile?.username ?? user?.email ?? 'S').charAt(0).toUpperCase();

  const desktopLinks = [...NAV_TABS.filter((t) => t.path !== '/app/capture'), ...MORE_LINKS];

  if (!prefsLoading && prefs && !prefs.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card/60 px-4 py-6 md:flex">
        <Link to="/app" className="mb-8 px-2">
          <Logo />
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {desktopLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === '/app'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-smooth',
                  isActive ? 'bg-secondary text-primary' : 'text-muted-foreground hover:bg-secondary/60'
                )
              }
            >
              <link.icon className="h-4.5 w-4.5" />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <Link
          to="/app/capture"
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:opacity-95"
        >
          <Sparkles className="h-4 w-4" /> Quick Capture
        </Link>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl md:pl-64">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="md:hidden">
            <Logo compact />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-foreground">
              {desktopLinks.find((l) => l.path === pathname)?.label ?? 'Smarty Logbook'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/app/search"
              aria-label="Search"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground transition-smooth active:scale-95"
            >
              <Search className="h-4.5 w-4.5" />
            </Link>
            <Link
              to="/app/reminders"
              aria-label="Notifications"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground transition-smooth active:scale-95"
            >
              <Bell className="h-4.5 w-4.5" />
            </Link>
            <Link
              to="/app/settings"
              aria-label="Profile"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-sm font-bold text-primary-foreground"
            >
              {initial}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-32 pt-4 md:pb-12 md:pl-64">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
};

export default AppShell;
