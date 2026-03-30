import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '@/lib/types';
import { BookOpen, Briefcase, Heart, Users, DollarSign, TrendingUp } from 'lucide-react';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  BookOpen, Briefcase, Heart, Users, DollarSign, TrendingUp,
};

const CategoriesPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 px-4 pt-0 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-foreground mb-1">Categories</h1>
      <p className="text-sm text-muted-foreground mb-5">Tap a category to view and manage entries</p>

      <div className="space-y-3">
        {CATEGORIES.map((cat) => {
          const Icon = iconMap[cat.icon];
          return (
            <button
              key={cat.id}
              onClick={() => navigate(`/category/${cat.id}`)}
              className="w-full flex items-center gap-4 bg-card rounded-2xl p-4 shadow-card text-left animate-fade-in transition-shadow hover:shadow-elevated"
            >
              <div className={`w-12 h-12 rounded-2xl ${cat.color} flex items-center justify-center flex-shrink-0`}>
                {Icon && <Icon className="w-6 h-6 text-primary-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{cat.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoriesPage;
