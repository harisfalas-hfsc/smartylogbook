import { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Search, Sparkles } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import BottomNav from '@/components/BottomNav';
import SiteFooter from '@/components/SiteFooter';
import Logo from '@/components/Logo';
import { MORE_LINKS, NAV_TABS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/lib/preferences';
import { useNotificationEngine } from '@/lib/reminders';

const AppShell = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const { prefs, loading: prefsLoading } = usePreferences();
  const [menuOpen, setMenuOpen] = useState(false);
  useNotificationEngine(prefs);
  const initial = (profile?.username ?? user?.email ?? 'S').charAt(0).toUpperCase();

  const desktopLinks = [...NAV_TABS.filter((t) => t.path !== '/app/capture'), ...MORE_LINKS];

  const sections = [
    { heading: 'Your Logbook', items: NAV_TABS },
    { heading: 'More', items: MORE_LINKS },
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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

      {/* Mobile header — Smarty Wellness family style */}
      <header className="sticky top-0 z-40 bg-background md:hidden">
        <div className="flex h-11 items-center justify-between gap-2 px-3">
          <div className="flex items-center gap-2">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open menu"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary hover:bg-primary/10"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="flex h-full w-[85%] max-w-[340px] flex-col gap-0 border-0 p-3 sm:max-w-[340px]">
                <div className="mb-1 flex h-10 shrink-0 items-center">
                  <Logo />
                </div>
                <nav className="flex-1 overflow-y-auto px-1 pb-6">
                  {sections.map((section) => (
                    <div key={section.heading} className="mt-1">
                      <div className="px-2 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {section.heading}
                      </div>
                      <ul className="space-y-0.5">
                        {section.items.map(({ path, label, icon: Icon }) => {
                          const active = pathname === path;
                          return (
                            <li key={path}>
                              <button
                                type="button"
                                onClick={() => { navigate(path); setMenuOpen(false); }}
                                className={cn(
                                  'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-colors',
                                  active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-primary/10'
                                )}
                              >
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                                  <Icon className="h-4 w-4" />
                                </span>
                                {label}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                  <div className="mt-1">
                    <div className="px-2 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Account
                    </div>
                    <button
                      type="button"
                      onClick={() => signOut()}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-foreground transition-colors hover:bg-primary/10"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <LogOut className="h-4 w-4" />
                      </span>
                      Sign out
                    </button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
            <Link to="/app" aria-label="Smarty Logbook home">
              <Logo />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/app/search"
              aria-label="Search"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background text-primary"
            >
              <Search className="h-4 w-4" />
            </Link>
            <Link
              to="/app/reminders"
              aria-label="Notifications"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background text-primary"
            >
              <Bell className="h-4 w-4" />
            </Link>
            <Link
              to="/app/account"
              aria-label="Account"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-primary text-xs font-bold text-primary-foreground"
            >
              {initial}
            </Link>
          </div>
        </div>
      </header>

      {/* Desktop top bar */}
      <header className="sticky top-0 z-30 hidden border-b border-border/60 bg-background/80 backdrop-blur-xl md:block md:pl-64">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            {desktopLinks.find((l) => l.path === pathname)?.label ?? 'Smarty Logbook'}
          </p>
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

      <main className="mx-auto max-w-3xl px-4 pt-4 md:pl-64">
        <Outlet />
      </main>

      <div className="pb-28 pt-6 md:pb-8 md:pl-64">
        <SiteFooter />
      </div>

      <BottomNav />
    </div>
  );
};

export default AppShell;
