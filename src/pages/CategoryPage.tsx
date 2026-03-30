import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CATEGORIES } from '@/lib/types';
import LifeCategory from '@/components/categories/LifeCategory';
import MoneyCategory from '@/components/categories/MoneyCategory';
import HealthCategory from '@/components/categories/HealthCategory';
import WorkCategory from '@/components/categories/WorkCategory';
import FamilyCategory from '@/components/categories/FamilyCategory';
import GrowthCategory from '@/components/categories/GrowthCategory';

const categoryComponents: Record<string, React.ComponentType<{ quickAdd?: boolean }>> = {
  life: LifeCategory,
  money: MoneyCategory,
  health: HealthCategory,
  work: WorkCategory,
  family: FamilyCategory,
  growth: GrowthCategory,
};

const CategoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const quickAdd = searchParams.get('add') === '1';
  const category = CATEGORIES.find(c => c.id === id);

  if (!category) {
    navigate('/');
    return null;
  }

  const Component = categoryComponents[category.id];

  return (
    <div className="min-h-screen pb-24 px-4 pt-3 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{category.label}</h1>
          <p className="text-xs text-muted-foreground">{category.description}</p>
        </div>
      </div>

      {Component && <Component quickAdd={quickAdd} />}
    </div>
  );
};

export default CategoryPage;
