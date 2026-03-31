import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const sections = [
  {
    title: 'App Usage',
    text: 'Smarty Logbook is a personal digital logbook for organizing and tracking daily life. Use the app responsibly and in compliance with local laws.',
  },
  {
    title: 'Data Accuracy',
    text: 'The app provides tools for tracking money, health, and productivity. We do not guarantee accuracy of calculations, insights, or suggestions. Always consult professionals for financial, medical, or legal decisions.',
  },
  {
    title: 'User Responsibility',
    text: 'You are responsible for all data you enter. Ensure your account credentials are kept secure. Do not share your password.',
  },
  {
    title: 'Limitation of Liability',
    text: 'Smarty Logbook is provided "as is" without warranty. We are not liable for data loss, inaccurate information, or decisions made based on app content.',
  },
  {
    title: 'Privacy',
    text: 'We respect your privacy. Only data you enter is stored, used solely for app functionality. No data is sold to third parties. See Privacy & Data for full details.',
  },
  {
    title: 'Changes to Terms',
    text: 'We may update these terms from time to time. Continued use of the app constitutes acceptance of any changes.',
  },
];

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 px-4 pt-2 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Terms & Policies</h1>
      </div>

      <div className="space-y-3">
        {sections.map((s) => (
          <div key={s.title} className="bg-card rounded-2xl p-5 shadow-card">
            <h2 className="text-sm font-bold text-foreground mb-1.5">{s.title}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{s.text}</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground text-center mt-6">
        Last updated: March 2026 • For full legal version, contact legal@smartylogbook.app
      </p>
    </div>
  );
};

export default TermsPage;
