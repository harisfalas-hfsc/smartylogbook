import { Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '@/lib/types';
import { BookOpen, Briefcase, Heart, Users, DollarSign, TrendingUp } from 'lucide-react';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  BookOpen, Briefcase, Heart, Users, DollarSign, TrendingUp,
};

const FabButton = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (id: string) => {
    setOpen(false);
    navigate(`/category/${id}`);
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
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute bottom-24 left-4 right-4 max-w-sm mx-auto bg-card rounded-2xl shadow-elevated p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-semibold text-muted-foreground mb-3 px-1">Add entry to...</p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = iconMap[cat.icon];
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleSelect(cat.id)}
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

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-fab flex items-center justify-center transition-transform active:scale-95"
      >
        <Plus className={`w-7 h-7 transition-transform ${open ? 'rotate-45' : ''}`} />
      </button>
    </>
  );
};

export default FabButton;
