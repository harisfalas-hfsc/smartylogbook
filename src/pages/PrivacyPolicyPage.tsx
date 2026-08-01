import { LegalPage, LegalSection } from '@/lib/legal';

const PrivacyPolicyPage = () => (
  <LegalPage
    eyebrow="Legal"
    title="Privacy Policy"
    subtitle="How Smarty Logbook collects, uses and protects your personal data under the EU General Data Protection Regulation (Regulation (EU) 2016/679)."
  >
    <LegalSection title="1. Who we are">
      <p>
        Smarty Logbook ("we", "us") is the data controller for the personal data processed through this
        application. Smarty Logbook is part of the Smarty Wellness ecosystem. For any privacy question or to
        exercise your rights, contact us through the in-app support channel.
      </p>
    </LegalSection>

    <LegalSection title="2. What data we process">
      <ul>
        <li><strong>Account data:</strong> email address, authentication credentials, account creation date.</li>
        <li><strong>Content you capture:</strong> notes, voice recordings and transcriptions, photos, receipts, PDFs and other documents you upload.</li>
        <li><strong>Health-related data:</strong> if you choose to log workouts, nutrition, sleep, symptoms, medical reports or blood tests, this is special category data under Article 9 GDPR.</li>
        <li><strong>Financial data:</strong> amounts, merchants and dates extracted from receipts or bills you upload.</li>
        <li><strong>Preferences:</strong> goals, coaching tone, reminder and notification settings.</li>
        <li><strong>Technical data:</strong> device and browser information, log data and security events.</li>
      </ul>
      <p>
        You decide what you upload. Please do not upload data about other people (for example a family
        member's medical report) unless you have a lawful basis to do so.
      </p>
    </LegalSection>

    <LegalSection title="3. Why we process it and on what legal basis">
      <ul>
        <li><strong>Providing the service</strong> (storing your entries, timeline, search) — performance of a contract, Art. 6(1)(b).</li>
        <li><strong>Special category / health data</strong> — your explicit consent, Art. 9(2)(a). You give it by choosing to record health information, and you can withdraw it at any time by deleting that content or your account.</li>
        <li><strong>AI processing</strong> (classification, extraction from documents, transcription, coaching and insights) — performance of a contract and, for health content, your explicit consent.</li>
        <li><strong>Security, abuse prevention and service improvement</strong> — our legitimate interests, Art. 6(1)(f).</li>
        <li><strong>Notifications and reminders you enable</strong> — consent, withdrawable in Settings.</li>
      </ul>
    </LegalSection>

    <LegalSection title="4. Automated processing and AI">
      <p>
        Smarty Assistant and the insight engine analyse your entries to generate summaries, tags, patterns and
        recommendations. This is decision support, not automated decision-making producing legal or similarly
        significant effects within the meaning of Art. 22 GDPR. Content you send to the AI features is
        transmitted to our AI processing provider solely to generate a response and is not used to train
        third-party models. You can use the Logbook without the AI features by simply not using them.
      </p>
    </LegalSection>

    <LegalSection title="5. Storage, security and processors">
      <p>
        Data is stored in managed cloud infrastructure with encryption in transit (TLS) and at rest. Uploaded
        files are kept in a private storage bucket accessible only to your authenticated account. Database
        row-level security ensures that each record is readable only by its owner. We use a small number of
        processors (cloud hosting and database, file storage, AI inference) bound by data processing
        agreements under Art. 28 GDPR.
      </p>
    </LegalSection>

    <LegalSection title="6. International transfers">
      <p>
        Where a processor operates outside the European Economic Area, transfers are covered by the European
        Commission's Standard Contractual Clauses or an adequacy decision, together with supplementary
        technical measures such as encryption.
      </p>
    </LegalSection>

    <LegalSection title="7. Retention">
      <p>
        We keep your content for as long as your account is active. If you delete an entry it is removed from
        your timeline and permanently deleted from backups within 30 days. If you delete your account, all
        personal data, uploaded files and AI-generated content are erased within 30 days, except where we must
        retain limited records to comply with a legal obligation.
      </p>
    </LegalSection>

    <LegalSection title="8. Your rights">
      <ul>
        <li>Access to your data and a copy of it (Art. 15).</li>
        <li>Rectification of inaccurate data (Art. 16).</li>
        <li>Erasure — "right to be forgotten" (Art. 17).</li>
        <li>Restriction of processing (Art. 18).</li>
        <li>Data portability in a machine-readable format (Art. 20).</li>
        <li>Objection to processing based on legitimate interests (Art. 21).</li>
        <li>Withdrawal of consent at any time, without affecting prior lawful processing.</li>
        <li>Complaint to your national supervisory authority.</li>
      </ul>
      <p>
        You can exercise access, export and deletion directly in Settings, or contact us. We respond within
        one month.
      </p>
    </LegalSection>

    <LegalSection title="9. Cookies and local storage">
      <p>
        We use strictly necessary storage to keep you signed in and to remember your preferences. We do not
        use advertising or cross-site tracking cookies.
      </p>
    </LegalSection>

    <LegalSection title="10. Children">
      <p>
        Smarty Logbook is not intended for children under 16. We do not knowingly collect data from children.
      </p>
    </LegalSection>

    <LegalSection title="11. Changes">
      <p>
        We may update this policy. Material changes will be announced in the app before they take effect.
      </p>
    </LegalSection>
  </LegalPage>
);

export default PrivacyPolicyPage;
