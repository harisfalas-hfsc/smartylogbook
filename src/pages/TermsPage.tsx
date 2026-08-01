import { LegalPage, LegalSection } from '@/lib/legal';

const TermsPage = () => (
  <LegalPage
    eyebrow="Legal"
    title="Terms & Conditions"
    subtitle="The agreement between you and Smarty Logbook. Please read it before using the service."
  >
    <LegalSection title="1. Agreement">
      <p>
        By creating an account or using Smarty Logbook you accept these Terms. If you do not accept them,
        do not use the service. These Terms are governed by the laws of an EU Member State and do not
        affect your mandatory rights as a consumer under EU consumer law.
      </p>
    </LegalSection>

    <LegalSection title="2. The service">
      <p>
        Smarty Logbook is a personal logging and organisation tool. You capture notes, voice recordings,
        photos, receipts, reports and other documents; the service stores them, classifies them with AI and
        produces summaries, search results, patterns and coaching suggestions.
      </p>
    </LegalSection>

    <LegalSection title="3. Your account">
      <ul>
        <li>You must be at least 16 years old.</li>
        <li>You are responsible for keeping your credentials secure and for all activity on your account.</li>
        <li>You must provide accurate registration information.</li>
      </ul>
    </LegalSection>

    <LegalSection title="4. Your content">
      <p>
        You keep all rights to the content you upload. You grant us a limited licence to store, process and
        display that content solely to operate the service for you — including sending it to our AI provider
        to generate a response. We do not sell your content and do not use it to train third-party models.
      </p>
      <p>You confirm that you have the right to upload each file, including documents that relate to others.</p>
    </LegalSection>

    <LegalSection title="5. Acceptable use">
      <ul>
        <li>Do not upload unlawful, infringing or malicious content.</li>
        <li>Do not upload other people's personal or health data without a lawful basis.</li>
        <li>Do not attempt to breach security, scrape, reverse engineer or overload the service.</li>
        <li>Do not use the service to provide medical, legal or financial advice to third parties.</li>
      </ul>
    </LegalSection>

    <LegalSection title="6. AI output">
      <p>
        AI-generated summaries, extractions, insights and coaching messages may be incomplete or incorrect.
        They are informational only and are not professional advice. See the Disclaimer. You are responsible
        for verifying anything important before acting on it.
      </p>
    </LegalSection>

    <LegalSection title="7. Subscriptions and withdrawal">
      <p>
        Where paid plans are offered, prices and billing periods are shown before purchase. As an EU consumer
        you have a 14-day right of withdrawal for digital services; by asking for immediate access you
        acknowledge that the right lapses once the service has been fully performed within that period. You
        may cancel a subscription at any time with effect from the end of the current billing period.
      </p>
    </LegalSection>

    <LegalSection title="8. Availability">
      <p>
        We aim for continuous availability but do not guarantee uninterrupted or error-free operation.
        Maintenance, updates and third-party outages may cause downtime. Keep your own copies of critical
        documents.
      </p>
    </LegalSection>

    <LegalSection title="9. Liability">
      <p>
        Nothing in these Terms excludes liability for death, personal injury caused by negligence, fraud, or
        any liability that cannot be excluded under applicable law. Subject to that, we are not liable for
        indirect or consequential loss, loss of data where you have not kept your own copies, or decisions
        you take based on AI output. Our total liability is limited to the amount you paid in the 12 months
        before the event giving rise to the claim.
      </p>
    </LegalSection>

    <LegalSection title="10. Termination">
      <p>
        You may delete your account at any time in Settings. We may suspend or terminate accounts that
        breach these Terms, with notice where reasonably possible. On termination your data is deleted as
        described in the Privacy Policy.
      </p>
    </LegalSection>

    <LegalSection title="11. Changes and disputes">
      <p>
        We may amend these Terms; material changes are announced in the app before they take effect.
        Disputes may be submitted to the European Commission's Online Dispute Resolution platform, and you
        may always bring proceedings in the courts of your country of residence.
      </p>
    </LegalSection>
  </LegalPage>
);

export default TermsPage;
