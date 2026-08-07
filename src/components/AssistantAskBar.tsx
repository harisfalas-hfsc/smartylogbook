import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  /** Controlled value — omit to let the bar manage its own text. */
  value?: string;
  onChange?: (value: string) => void;
  /** Return true when the page handled the text itself (e.g. timeline filtering). */
  onSubmit?: (value: string) => boolean | void;
  placeholder?: string;
  hint?: string;
  className?: string;
}

/**
 * The one Smarty Assistant input, used on every page where you can type something.
 * Anything the page cannot answer itself is handed to the Assistant.
 */
const AssistantAskBar = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Ask Smarty Assistant…',
  hint,
  className,
}: Props) => {
  const navigate = useNavigate();
  const [own, setOwn] = useState('');
  const text = value ?? own;
  const setText = (v: string) => (onChange ? onChange(v) : setOwn(v));

  const submit = () => {
    const q = text.trim();
    if (!q) return;
    const handled = onSubmit?.(q);
    if (handled) return;
    navigate(`/app/assistant?ask=${encodeURIComponent(q)}`);
  };

  return (
    <div className={cn('animate-fade-up', className)}>
      <div className="smarty-card flex items-center gap-2 border-2 border-primary/25 px-3 py-2.5 focus-within:border-primary/60">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground">
          <Send className="h-4 w-4" />
        </span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={placeholder}
          aria-label="Ask Smarty Assistant"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
        />
        {text ? (
          <button onClick={() => setText('')} aria-label="Clear" className="shrink-0 text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        ) : null}
        <button
          onClick={submit}
          className="shrink-0 rounded-xl bg-gradient-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground"
        >
          Ask
        </button>
      </div>
      {hint ? <p className="mt-1 px-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
};

export default AssistantAskBar;
