import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const categories = [
  {
    title: 'Getting Started',
    faqs: [
      { q: 'What is Smarty Logbook?', a: 'A simple, all-in-one digital logbook to organize, track, and improve every aspect of your daily life — notes, money, health, work, family, and personal growth.' },
      { q: 'Do I need to set anything up?', a: 'No setup needed. Just create an account and start logging. The app adapts to your usage.' },
    ],
  },
  {
    title: 'Using Categories',
    faqs: [
      { q: 'How do I add an entry?', a: 'Tap the + button at the bottom of the screen, select a category, and start logging. It takes under 10 seconds.' },
      { q: 'Can I customize categories?', a: 'Categories are pre-built for the best experience. Within each category, you can add custom tags and labels.' },
    ],
  },
  {
    title: 'Managing Data',
    faqs: [
      { q: 'What happens if I delete the app?', a: 'Your data remains safely stored in the cloud. When you reinstall and log in, everything is restored.' },
      { q: 'Can I export my data?', a: 'Data export (PDF & CSV) is coming soon. You\'ll be able to download all your entries.' },
      { q: 'Is my data safe?', a: 'Yes. All data is encrypted, stored securely, and never shared with third parties.' },
    ],
  },
  {
    title: 'Troubleshooting',
    faqs: [
      { q: 'How do I reset my password?', a: 'Go to the login screen, tap "Forgot password?", enter your email, and follow the reset link sent to your inbox.' },
      { q: 'The app feels slow, what can I do?', a: 'Try clearing your browser cache or updating to the latest version. If the issue persists, contact support.' },
    ],
  },
];

const HelpPage = () => {
  const navigate = useNavigate();
  const [openIdx, setOpenIdx] = useState<string | null>(null);

  const toggleFaq = (key: string) => setOpenIdx(openIdx === key ? null : key);

  return (
    <div className="min-h-screen pb-24 px-4 pt-2 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Help & Support</h1>
      </div>

      {categories.map((cat) => (
        <div key={cat.title} className="mb-4">
          <h2 className="text-sm font-bold text-foreground mb-2 px-1">{cat.title}</h2>
          <div className="space-y-2">
            {cat.faqs.map((faq) => {
              const key = `${cat.title}-${faq.q}`;
              const isOpen = openIdx === key;
              return (
                <button
                  key={key}
                  onClick={() => toggleFaq(key)}
                  className="w-full bg-card rounded-2xl p-4 shadow-card text-left"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground pr-4">{faq.q}</p>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </div>
                  {isOpen && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{faq.a}</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Contact */}
      <div className="bg-card rounded-2xl p-5 shadow-card mt-2">
        <h2 className="text-sm font-bold text-foreground mb-1">Need more help?</h2>
        <p className="text-xs text-muted-foreground mb-3">Reach out and we'll get back to you within 24 hours.</p>
        <a
          href="mailto:support@smartylogbook.app"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold"
        >
          <Mail className="w-4 h-4" />
          Contact Support
        </a>
      </div>
    </div>
  );
};

export default HelpPage;
