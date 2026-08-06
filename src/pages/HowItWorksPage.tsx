import { Wand2, Brain, Inbox, Sparkles, ShieldCheck } from 'lucide-react';
import { Panel, SubCard, PageHeader, givesIn, givesBack, Hl, ExplainerRow } from '@/lib/marketing';


import PillarsCircle from '@/components/PillarsCircle';


const HowItWorksPage = () => (
  <div className="mx-auto max-w-5xl px-3 py-7 sm:px-5 sm:py-10">
    <PageHeader
      eyebrow="How it works"
      title="You put it in. Smarty Logbook does the thinking."
      subtitle="There are four ways in: type it, say it, snap it or upload it. From there it understands, relates, remembers and finds it for you."
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
          The moment you <Hl>save it</Hl>, your logbook takes over. <Hl>Every</Hl> note, photo, receipt, report and
          number is read, given a date and a meaning, and filed into the right category, without you
          choosing anything. The <Hl>Smarty Assistant</Hl> understands what it is, connects it to what you
          already have, keeps <Hl>everything in order</Hl>, and brings it back to you the moment it matters.
        </p>
      </SubCard>
    </Panel>


    <Panel
      eyebrow="Asking the Assistant"
      eyebrowEmoji="💬"
      badge={Sparkles}
      title={<>Your logbook's brain, <span className="gradient-text">not a chatbot.</span></>}
      lead="It answers about your life, because it has read it."
    >
      <SubCard>
        <p className="mx-auto max-w-3xl text-center text-[14px] leading-relaxed text-foreground sm:text-base md:text-lg">
          <Hl>Smarty Assistant</Hl> works only with what is in your logbook: your entries, documents,
          photos, reminders, calendar, spending and the patterns behind them. Ask it{' '}
          <Hl>"when was my last blood test?"</Hl>, <Hl>"how much did I spend on groceries last month?"</Hl>,{' '}
          <Hl>"explain this report"</Hl>, <Hl>"what is coming up next week?"</Hl> or{' '}
          <Hl>"schedule my dentist on Tuesday at 10:00"</Hl>. Ask it for the weather, the news or a generic
          workout programme and it will politely point you back to your records, and that question is{' '}
          <Hl>not counted</Hl> against your conversations.
        </p>
      </SubCard>
    </Panel>


    <Panel
      eyebrow="Privacy"
      eyebrowEmoji="🔒"
      badge={ShieldCheck}
      title={<>Private by default, <span className="gradient-text">not by setting.</span></>}
      lead="Your logbook is yours alone. Tap a card to see exactly what that means."
    >
      <SubCard>
        <p className="mx-auto max-w-3xl text-center text-[14px] leading-relaxed text-foreground sm:text-base md:text-lg">
          Everything you capture is <Hl>encrypted</Hl> in transit and at rest, and locked to your account
          so <Hl>only you</Hl> can read it. Documents sit in a private bucket behind short-lived signed
          links. Nothing is sold, nothing is shown to other users and nothing is used to{' '}
          <Hl>train third-party models</Hl>. You can export everything, or delete it all, whenever you want.
        </p>
      </SubCard>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <ExplainerRow id="private-by-default" />
        <ExplainerRow id="no-filing" />
        <ExplainerRow id="no-busywork" />
      </div>
    </Panel>





  </div>
);

export default HowItWorksPage;
