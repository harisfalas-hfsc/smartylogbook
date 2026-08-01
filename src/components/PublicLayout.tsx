import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, ArrowRight, Home, Info, Sparkles, Layers, Tag, MessageSquareQuote, Users, HelpCircle, ShieldCheck, User } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Logo from '@/components/Logo';
import BackButton from '@/components/BackButton';
import SiteFooter from '@/components/SiteFooter';
import { useAuth } from '@/contexts/AuthContext';

const discoverLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/about', label: 'About', icon: Info },
  { to: '/how-it-works', label: 'How it works', icon: Sparkles },
  { to: '/features', label: 'Features & Modules', icon: Layers },
  { to: '/pricing', label: 'Pricing', icon: Tag },
  { to: '/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { to: '/community', label: 'Community', icon: Users },
  { to: '/faq', label: 'FAQ', icon: HelpCircle },
  { to: '/security', label: 'Security & Privacy', icon: ShieldCheck },
];

const PublicLayout = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, profile } = useAuth();
  const initial = (profile?.username ?? user?.email ?? '').charAt(0).toUpperCase();

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 bg-background">
        <div className="mx-auto flex h-11 max-w-6xl items-center justify-between gap-2 px-3">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
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
                  <div className="px-2 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Discover
                  </div>
                  <ul className="space-y-0.5">
                    {discoverLinks.map((l) => (
                      <li key={l.to}>
                        <NavLink
                          to={l.to}
                          end={l.to === '/'}
                          className={({ isActive }) =>
                            `flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                              isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-primary/10'
                            }`
                          }
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                            <l.icon className="h-4 w-4" />
                          </span>
                          {l.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/auth"
                    className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
                  >
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
            <BackButton />
            <Link to="/" aria-label="Smarty Logbook home">
              <Logo />
            </Link>
          </div>
          <Link
            to={user ? '/app' : '/auth'}
            aria-label={user ? 'Open your logbook' : 'Sign in or create an account'}
            title={user ? 'Your logbook' : 'Sign in'}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary text-primary transition-smooth hover:bg-primary/10 active:scale-95"
          >
            {user && initial ? (
              <span className="text-[13px] font-bold leading-none">{initial}</span>
            ) : (
              <User className="h-4 w-4" strokeWidth={2.5} />
            )}
          </Link>
        </div>
      </header>


      <main className="flex-1">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  );
};

export default PublicLayout;
