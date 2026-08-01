import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube } from 'lucide-react';

const socials = [
  { href: '#', label: 'Facebook', Icon: Facebook },
  { href: '#', label: 'Instagram', Icon: Instagram },
  { href: '#', label: 'YouTube', Icon: Youtube },
];

const legal = [
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/terms-and-conditions', label: 'Terms & Conditions' },
  { to: '/disclaimer', label: 'Disclaimer' },
];

const SiteFooter = () => (
  <footer className="mt-auto bg-background px-4 py-4">
    <div className="mx-auto flex max-w-7xl flex-col items-center gap-2">
      <div className="flex items-center gap-4">
        {socials.map(({ href, label, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="rounded-full border-2 border-primary p-2 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <Icon className="h-5 w-5" />
          </a>
        ))}
        <a
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="TikTok"
          className="rounded-full border-2 border-primary p-2 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
          </svg>
        </a>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground md:gap-4">
        {legal.map((l) => (
          <Link key={l.to} to={l.to} className="transition-colors hover:text-primary">
            {l.to === '/terms-and-conditions' ? (
              <>
                <span className="md:hidden">T&Cs</span>
                <span className="hidden md:inline">Terms & Conditions</span>
              </>
            ) : (
              l.label
            )}
          </Link>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()}{' '}
          <span className="font-semibold text-primary">Smarty Logbook</span>
        </p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
