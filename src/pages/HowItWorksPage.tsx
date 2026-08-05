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
    >
      <SubCard>
        <p className="mx-auto max-w-3xl text-center text-[14px] leading-relaxed text-foreground sm:text-base md:text-lg">
          The moment you save it, your logbook takes over. Every note, photo, receipt, report and
          number is read, given a date and a meaning, and filed into the right category — without you
          choosing anything. The Smarty Assistant understands what it is, connects it to what you
          already have, keeps everything in order, and brings it back to you the moment it matters.
        </p>
      </SubCard>
    </Panel>


  </div>
);

export default HowItWorksPage;
