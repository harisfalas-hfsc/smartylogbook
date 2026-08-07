import { useEffect, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, CircleHelp, Info, LifeBuoy, LogOut, Menu, Search, ShieldCheck, Sparkles, Tag } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import BottomNav from '@/components/BottomNav';
import SiteFooter from '@/components/SiteFooter';
import Logo from '@/components/Logo';
import BackButton, { resetNavDepth } from '@/components/BackButton';
import { MORE_LINKS, NAV_TABS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/lib/admin';
import { usePreferences } from '@/lib/preferences';
import { useNotificationEngine } from '@/lib/reminders';
import { useMemoryIndex } from '@/lib/semantic';
import { useUnreadMessages } from '@/lib/messages';


const AppShell = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const { prefs, loading: prefsLoading } = usePreferences();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAdmin } = useIsAdmin();
  useNotificationEngine(prefs);
  useMemoryIndex(!prefsLoading && !!user);
  const unread = useUnreadMessages();
  const initial = (profile?.username ?? user?.email ?? 'S').charAt(0).toUpperCase();


  const sections = [
    { heading: 'Your Logbook', items: NAV_TABS },
    { heading: 'More', items: MORE_LINKS },
    { heading: 'Discover', items: [
      { path: '/about', label: 'About', icon: Info },
      { path: '/how-it-works', label: 'How it works', icon: Sparkles },
      { path: '/pricing', label: 'Pricing', icon: Tag },
      { path: '/faq', label: 'FAQ', icon: CircleHelp },
      { path: '/security', label: 'Security & Privacy', icon: ShieldCheck },
      { path: '/contact', label: 'Contact & support', icon: LifeBuoy },
    ] },
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  if (!prefsLoading && prefs && !prefs.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Single header for every screen size */}
      <header className="sticky top-0 z-40 bg-background">
        <div className="mx-auto flex h-11 max-w-3xl items-center justify-between gap-2 px-3 lg:h-14 lg:px-4">
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
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => { navigate('/app/admin'); setMenuOpen(false); }}
                        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-foreground transition-colors hover:bg-primary/10"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                          <ShieldCheck className="h-4 w-4" />
                        </span>
                        Admin panel
                      </button>
                    )}
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
            <BackButton />

            <Link
              to="/app"
              aria-label="Smarty Logbook home"
              onClick={(e) => {
                e.preventDefault();
                navigate('/app', { replace: true });
                resetNavDepth();
              }}
            >
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
              to="/app/messages"
              aria-label="Message center"
              className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background text-primary"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
            <Link
              to="/app/settings"
              aria-label="Account, plan and settings"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-primary text-xs font-bold text-primary-foreground"
            >
              {initial}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-4">
        <Outlet />
      </main>

      <div className="pb-28" />


      <BottomNav />

    </div>
  );
};

export default AppShell;
