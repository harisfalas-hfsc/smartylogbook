import { ArrowLeft, Database, Download, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-24 px-4 pt-2 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Privacy & Data</h1>
      </div>

      {/* Summary */}
      <div className="bg-card rounded-2xl p-5 shadow-card mb-4">
        <h2 className="text-sm font-bold text-foreground mb-2">Your Data</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          We collect only the data you enter — notes, tasks, health logs, expenses, and reflections. 
          This data is used solely to provide app functionality. We never sell your data to third parties. 
          All data is stored securely and encrypted.
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <Database className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Stored Data</p>
            <p className="text-xs text-muted-foreground">Notes, tasks, health, money, reflections</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4 opacity-60">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
            <Download className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Export Data</p>
            <p className="text-xs text-muted-foreground">Coming soon — PDF & CSV export</p>
          </div>
        </div>
      </div>

      {/* Rights */}
      <div className="bg-card rounded-2xl p-5 shadow-card mt-4">
        <h2 className="text-sm font-bold text-foreground mb-2">Your Rights (GDPR)</h2>
        <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
          <li>• Access all your stored data</li>
          <li>• Correct any inaccurate data</li>
          <li>• Delete all your data permanently</li>
          <li>• Withdraw consent at any time</li>
          <li>• Request data portability</li>
        </ul>
        <p className="text-xs text-muted-foreground mt-3">
          Contact: <span className="text-primary font-medium">privacy@smartylogbook.app</span>
        </p>
      </div>
    </div>
  );
};

export default PrivacyPage;
