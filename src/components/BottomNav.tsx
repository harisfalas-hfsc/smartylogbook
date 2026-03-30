import { Home, LayoutGrid, BarChart3, UserRound, Plus, BookOpen, Briefcase, Heart, Users, DollarSign, TrendingUp } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CATEGORIES } from '@/lib/types';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  BookOpen,
  Briefcase,
  Heart,
  Users,
  DollarSign,
  TrendingUp,
};

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/categories', icon: LayoutGrid, label: 'Categories' },
  { path: '/insights', icon: BarChart3, label: 'Insights' },
  { path: '/settings', icon: UserRound, label: 'Profile' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/categories') return location.pathname === '/categories' || location.pathname.startsWith('/category/');
    return location.pathname === path;
  };

  const handleCategoryAdd = (id: string) => {
    setOpen(false);
    navigate(`/category/${id}?add=1`);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              className="absolute bottom-24 left-4 right-4 max-w-sm mx-auto bg-card rounded-2xl shadow-elevated p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-semibold text-muted-foreground mb-3 px-1">Add entry to...</p>
              <div className="grid grid-cols-1 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = iconMap[cat.icon];
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryAdd(cat.id)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
                    >
                      <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center`}>
                        {Icon && <Icon className="w-5 h-5 text-primary-foreground" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground leading-tight">{cat.label}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{cat.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border safe-area-bottom">
        <div className="max-w-lg mx-auto grid grid-cols-5 items-center h-16 px-1">
          {tabs.slice(0, 2).map((tab) => {
            const active = isActive(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}

          <div className="flex justify-center">
            <button
              onClick={() => setOpen((v) => !v)}
              className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-fab flex items-center justify-center transition-transform active:scale-95"
            >
              <Plus className={`w-6 h-6 transition-transform ${open ? 'rotate-45' : ''}`} />
            </button>
          </div>

          {tabs.slice(2).map((tab) => {
            const active = isActive(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex flex-col items-center gap-0.5 px-2 py-2 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomNav;
