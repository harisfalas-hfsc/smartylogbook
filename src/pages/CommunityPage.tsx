import { Link } from 'react-router-dom';
import { ArrowRight, Dumbbell, Salad, Footprints, Users } from 'lucide-react';
import { PageHeader, Block } from '@/lib/marketing';

const apps = [
  { icon: Dumbbell, t: 'Smarty Gym', s: 'Workouts and training programs that log straight into your timeline.' },
  { icon: Salad, t: 'Smarty Diet', s: 'Meals and nutrition tracking feeding the same brain.' },
  { icon: Footprints, t: 'Smarty Move', s: 'Daily movement and activity, automatically captured.' },
];

const CommunityPage = () => (
  <div className="mx-auto max-w-3xl px-5 py-10">
    <PageHeader
      eyebrow="Community"
      title="You're not building a second brain alone."
      subtitle="Thousands of people across the Smarty Wellness ecosystem log, learn and improve together."
    />

    <Block title="The Smarty ecosystem">
      <div className="grid gap-2.5 sm:grid-cols-3">
        {apps.map((a) => (
          <div key={a.t} className="smarty-card p-5">
            <a.icon className="h-5 w-5 text-primary" />
            <p className="mt-2.5 text-sm font-bold text-foreground">{a.t}</p>
            <p className="mt-1 text-xs text-muted-foreground">{a.s}</p>
          </div>
        ))}
      </div>
    </Block>

    <Block title="Join in">
      <div className="smarty-card flex items-center gap-3 p-5">
        <Users className="h-6 w-6 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">
          Share insights, ask questions and get tips from members who track their whole life in one place.
        </p>
      </div>
      <Link
        to="/auth"
        className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth active:scale-95"
      >
        Create your account <ArrowRight className="h-4 w-4" />
      </Link>
    </Block>
  </div>
);

export default CommunityPage;
