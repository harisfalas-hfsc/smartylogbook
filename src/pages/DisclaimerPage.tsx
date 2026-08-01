import { LegalPage, LegalSection } from '@/lib/legal';

const DisclaimerPage = () => (
  <LegalPage
    eyebrow="Legal"
    title="Disclaimer"
    subtitle="Smarty Logbook is an organisation tool, not a medical, financial or legal professional."
  >
    <LegalSection title="Not medical advice">
      <p>
        Smarty Logbook is not a medical device within the meaning of Regulation (EU) 2017/745 and is not
        intended to diagnose, treat, cure, monitor or prevent any disease or condition. Health entries,
        uploaded blood tests or medical reports, and anything Smarty Assistant says about them are informational
        only. Always consult a qualified healthcare professional before making decisions about your health,
        medication, training or nutrition, and never delay seeking medical advice because of something you
        read in this app. In an emergency call your local emergency number.
      </p>
    </LegalSection>

    <LegalSection title="Not financial or legal advice">
      <p>
        Amounts extracted from receipts, spending patterns and budget observations are estimates produced by
        automated processing. They are not accounting, tax, investment or legal advice, and may contain
        errors. Verify figures against your original documents and consult a qualified professional where
        it matters.
      </p>
    </LegalSection>

    <LegalSection title="Accuracy of AI output">
      <p>
        The AI features classify, transcribe, extract and summarise your content and can misread handwriting,
        currencies, dates, units and clinical values, or generate plausible but incorrect statements. Treat
        every output as a suggestion to be checked, not a fact.
      </p>
    </LegalSection>

    <LegalSection title="Fitness and nutrition">
      <p>
        Any workout, movement or nutrition suggestion is general in nature and may not suit your condition.
        Consult a physician before starting a new programme, especially if you are pregnant, injured, or have
        a cardiovascular, metabolic or musculoskeletal condition. Stop immediately if you feel unwell.
      </p>
    </LegalSection>

    <LegalSection title="Your records remain your responsibility">
      <p>
        Smarty Logbook is not an official record-keeping system. Keep original copies of medical, legal,
        insurance and financial documents. We are not liable for loss, corruption or misinterpretation of
        stored content.
      </p>
    </LegalSection>

    <LegalSection title="No professional relationship">
      <p>
        Using Smarty Logbook or Smarty Assistant does not create a doctor-patient, coach-client, accountant-client
        or attorney-client relationship.
      </p>
    </LegalSection>
  </LegalPage>
);

export default DisclaimerPage;
