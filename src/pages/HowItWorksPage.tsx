import { Wand2, Brain, Inbox, Sparkles } from 'lucide-react';
import { Panel, SubCard, PageHeader, givesIn, givesBack } from '@/lib/marketing';
import StepsCircle from '@/components/StepsCircle';
import PillarsCircle from '@/components/PillarsCircle';


const HowItWorksPage = () => (
  <div className="mx-auto max-w-5xl px-3 py-7 sm:px-5 sm:py-10">
    <PageHeader
      eyebrow="How it works"
      title="You put it in. Smarty Logbook does the thinking."
      subtitle="Four ways in — type, say, snap, upload. Then it understands, relates, remembers and finds it for you."
    />



    <Panel
      eyebrow="The whole idea"
      eyebrowEmoji="🔁"
      badge={Wand2}
      title={<>Put anything in, <span className="gradient-text">get sense back.</span></>}
      lead="No forms, no naming, no filing."
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <SubCard label="You put in" labelEmoji="📥">
          <PillarsCircle items={givesIn} size="sm" centerIcon={Inbox} centerLabel="You put in" />
        </SubCard>
        <SubCard label="It gives back" labelEmoji="✨">
          <PillarsCircle items={givesBack} size="sm" centerIcon={Sparkles} centerLabel="It gives back" />
        </SubCard>
      </div>
    </Panel>


    <Panel
      eyebrow="What happens next"
      eyebrowEmoji="🔄"
      badge={Brain}
      title={<>What happens the <span className="gradient-text">moment you save.</span></>}
      lead="Six quiet stages, in order, every time."
    >
      <StepsCircle />

    </Panel>

  </div>
);

export default HowItWorksPage;
