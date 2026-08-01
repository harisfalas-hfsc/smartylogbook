import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Compass, ArrowRight, Home, Info, Sparkles, Layers, Tag, MessageSquareQuote, Users, HelpCircle, ShieldCheck } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Logo from '@/components/Logo';

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

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Discover"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-soft transition-smooth active:scale-95"
                >
                  <Compass className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[86%] max-w-[330px] border-0 p-4">
                <div className="mb-5 mt-1">
                  <Logo />
                </div>
                <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Discover</p>
                <nav className="space-y-1">
                  {discoverLinks.map((l) => (
                    <NavLink
                      key={l.to}
                      to={l.to}
                      end={l.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-smooth ${
                          isActive ? 'bg-secondary text-primary' : 'text-foreground hover:bg-secondary/60'
                        }`
                      }
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                        <l.icon className="h-4 w-4" />
                      </span>
                      {l.label}
                    </NavLink>
                  ))}
                </nav>
                <Link
                  to="/auth"
                  className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </SheetContent>
            </Sheet>
            <Link to="/" aria-label="Smarty Logbook home">
              <Logo compact />
            </Link>
          </div>
          <Link
            to="/auth"
            className="rounded-2xl bg-gradient-primary px-3.5 py-2 text-[13px] font-semibold text-primary-foreground shadow-glow transition-smooth active:scale-95"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <Logo />
          <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
            An AI-powered personal operating system. Part of the Smarty Wellness ecosystem.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {discoverLinks.slice(1).map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-foreground">{l.label}</Link>
            ))}
          </div>
        </div>
        <div className="border-t border-border px-5 py-4 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Smarty Wellness. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
