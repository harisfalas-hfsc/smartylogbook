import { useEffect, useRef, useState } from "react";
import { ExternalLink, Sparkles, X } from "lucide-react";
import logoMove from "@/assets/smartymove-logo.png";
import logoDiet from "@/assets/smartydiet-logo.png";
import logoGym from "@/assets/smartygym-icon.png";
import logoWorkout from "@/assets/smartyworkout-logo.png";

const CURRENT_APP: "gym" | "move" | "diet" | "workout" | "logbook" = "logbook";

type SisterApp = {
  id: "gym" | "move" | "diet" | "workout" | "logbook";
  name: string;
  tagline: string;
  url: string;
  image: string;
};

const SISTER_APPS: SisterApp[] = [
  {
    id: "gym",
    name: "SmartyGym",
    tagline: "Train smart. Get stronger. Feel younger.",
    url: "https://smartygym.com",
    image: logoGym,
  },
  {
    id: "move",
    name: "SmartyMove",
    tagline: "Check your posture. Correct your movement. Live better.",
    url: "https://smarty-motion-pro.lovable.app",
    image: logoMove,
  },
  {
    id: "diet",
    name: "SmartyDiet",
    tagline: "Eat smart. Fuel your body. Live longer.",
    url: "https://smarty-meals-hub.lovable.app",
    image: logoDiet,
  },
  {
    id: "workout",
    name: "Smarty Workout",
    tagline: "Build your workout. Track your progress. Stay motivated.",
    url: "https://smarty-workout-buddy.lovable.app",
    image: logoWorkout,
  },
];

const DELAY_MS = 30000;

export const SisterAppsPopup = () => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setMounted(true);
      setOpen(true);
    }, DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  const others = SISTER_APPS.filter((a) => a.id !== CURRENT_APP);

  if (!mounted) return null;

  return (
    <>
      {open && (
        <div
          aria-hidden="false"
          className="fixed inset-0 z-[58] bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        ref={panelRef}
        aria-hidden={!open}
        className={`fixed top-1/2 -translate-y-1/2 left-0 z-[60] flex items-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${open ? "translate-x-0" : "-translate-x-[calc(100%+10px)]"}`}
      >
        <aside className="w-[260px] rounded-r-2xl bg-background py-4 pl-4 pr-2 shadow-[4px_0_24px_rgba(15,23,42,0.12)]">
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Smarty Family
            </span>
            <h2 className="mt-1 text-[15px] font-bold leading-tight text-foreground">
              Complete your wellness journey
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {others.map((app) => (
              <a
                key={app.id}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 py-1 transition-transform duration-300 hover:translate-x-1 focus-visible:outline-none"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center transition-transform duration-500 group-hover:scale-110">
                  <img
                    src={app.image}
                    alt={app.name}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold leading-tight text-foreground transition-colors group-hover:text-primary">
                    {app.name}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-muted-foreground">
                    {app.tagline}
                  </p>
                </div>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-primary" />
              </a>
            ))}
          </div>
        </aside>

        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Hide panel"
          className="ml-2 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-[4px_0_12px_rgba(15,23,42,0.08)] transition-colors hover:bg-secondary hover:text-primary"
        >
          <X className="h-7 w-7" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Show sister apps"
        className={`fixed top-1/2 left-0 z-[59] h-24 w-2 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_28px_hsl(var(--primary)/0.65)] transition-all duration-300 hover:w-3 ${open ? "pointer-events-none opacity-0" : "opacity-100"}`}
      />
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Show sister apps"
          className="fixed top-1/2 left-0 z-[58] h-20 w-6 -translate-y-1/2 opacity-0"
        />
      )}
    </>
  );
};

export default SisterAppsPopup;
