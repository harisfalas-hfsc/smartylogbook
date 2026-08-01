import { Link } from 'react-router-dom';
import { ArrowRight, Users, MessageSquareQuote, Lightbulb, Heart } from 'lucide-react';
import { PageHeader, Block } from '@/lib/marketing';

const values = [
  { e: '💬', icon: MessageSquareQuote, t: 'Share what works', s: 'How other members capture, ask and stay on top of their life.' },
  { e: '💡', icon: Lightbulb, t: 'Learn the tricks', s: 'Prompts and habits that make the Smarty Assistant far more useful.' },
  { e: '❤️', icon: Heart, t: 'Shape the roadmap', s: 'Feature requests from members drive what gets built next.' },
];

const CommunityPage = () => (
  <div className="mx-auto max-w-4xl px-4 py-8 sm:px-5 sm:py-10">
    <PageHeader
      eyebrow="Community"
      title="You're not building a second brain alone."
      subtitle="People who track their whole life in one place, learning from each other."
    />

    <Block title="What happens inside">
      <div className="grid gap-2.5 sm:grid-cols-3">
        {values.map((v) => (
          <div key={v.t} className="smarty-card p-5">
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{v.e}</span>
              <v.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2.5 text-sm font-bold text-foreground">{v.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{v.s}</p>
          </div>
        ))}
      </div>
    </Block>

    <Block title="Join in">
      <div className="smarty-card flex items-start gap-3 p-5">
        <Users className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Ask questions, share insights and get tips from members who keep their health, money, work and
          personal life in one logbook.
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
