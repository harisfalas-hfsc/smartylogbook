import { NavLink, useLocation } from 'react-router-dom';
import { NAV_TABS } from '@/lib/constants';
import { cn } from '@/lib/utils';

const BottomNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom lg:hidden">
      <div className="mx-auto max-w-lg px-3 pb-3">
        <div className="glass flex items-center justify-between rounded-3xl px-2 py-2 shadow-elevated">
          {NAV_TABS.map((tab) => {
            const active = pathname === tab.path;
            const isCapture = tab.path === '/app/capture';
            if (isCapture) {
              return (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  aria-label="Quick capture"
                  className="relative -mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow transition-smooth active:scale-95"
                >
                  <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/30" />
                  <tab.icon className="relative h-7 w-7" />
                </NavLink>
              );
            }
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                end={tab.path === '/app'}
                className={cn(
                  'flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-smooth',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <tab.icon className={cn('h-5 w-5 transition-smooth', active && 'scale-110')} />
                {tab.label}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
