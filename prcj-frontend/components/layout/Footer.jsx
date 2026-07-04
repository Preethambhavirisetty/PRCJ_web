import { Link } from '@/lib/router.jsx';
import { GoldDivider, LotusDivider } from '@/components/brand';
import { Mail, MapPin, Phone } from 'lucide-react';

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const YoutubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="currentColor" stroke="none" />
  </svg>
);

const TwitterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);

const FOOTER_LINKS = {
  Shop: [
    { label: 'Glory Collections', href: '/shop?collection=glory' },
    { label: 'Bridal Collections', href: '/shop?collection=bridal' },
    { label: 'Men Collections', href: '/shop?gender=men' },
    { label: 'Royal', href: '/shop?collection=royal' },
    { label: 'Revolution Collections', href: '/shop?collection=revolution' },
    { label: 'Virtual Try-On', href: '/tryon' },
  ],
  Help: [
    { label: 'FAQs', href: '/help/faq' },
    { label: 'Size Guide', href: '/help/size-guide' },
    { label: 'Care Guide', href: '/help/care-guide' },
    { label: 'Track Order', href: '/account/orders' },
    { label: 'Returns & Exchange', href: '/help/returns' },
  ],
  Company: [
    { label: 'About PRCJ', href: '/about' },
    { label: 'Our Craftsmen', href: '/craftsmen' },
    { label: 'Sustainability', href: '/sustainability' },
    { label: 'Press', href: '/press' },
    { label: 'Careers', href: '/careers' },
  ],
};

const SOCIAL = [
  { icon: <InstagramIcon />, href: '#', label: 'Instagram' },
  { icon: <FacebookIcon />, href: '#', label: 'Facebook' },
  { icon: <YoutubeIcon />, href: '#', label: 'YouTube' },
  { icon: <TwitterIcon />, href: '#', label: 'Twitter' },
];

const CERTIFICATIONS = ['BIS Hallmark', 'IGI Certified', 'GIA Certified', 'ISO 9001'];

export function Footer() {
  return (
    <footer className="bg-[#1a0e0e] text-[#F8F4E8]">
      <GoldDivider />
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <h2 className="gold-text-static mb-1 text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              PRCJ
            </h2>
            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-[#C9933A]">Fine Jewellery</p>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-[#9e9790]">
              PRCJ has imagined fine Indian jewellery since 1997, from Glory platinum and silver stone pieces to bridal, royal, men's and revolution collections.
            </p>

            <div className="space-y-2 text-sm text-[#9e9790]">
              <a href="tel:+919010186899" className="flex items-center gap-2 transition-colors hover:text-[#C9933A]">
                <Phone size={14} className="text-[#C9933A]" />
                +91 90101 86899
              </a>
              <a href="mailto:prcjewelery@gmail.com" className="flex items-center gap-2 transition-colors hover:text-[#C9933A]">
                <Mail size={14} className="text-[#C9933A]" />
                prcjewelery@gmail.com
              </a>
              <p className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0 text-[#C9933A]" />
                Established in India, 1997
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#C9933A]/30 text-[#9e9790] transition-colors hover:border-[#C9933A] hover:text-[#C9933A]"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#C9933A]">{title}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-[#9e9790] transition-colors hover:text-[#E8C97A]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-[#C9933A]/20 bg-white/5 p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="flex-1">
              <p className="text-base font-semibold text-[#E8C97A]" style={{ fontFamily: 'var(--font-display)' }}>
                Join the PRCJ Circle
              </p>
              <p className="text-sm text-[#9e9790]">Get exclusive previews, styling tips, and member-only offers.</p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 rounded-lg border border-[#C9933A]/30 bg-white/10 px-4 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-[#6B6560] focus:border-[#C9933A] sm:w-56"
              />
              <button className="btn-gold whitespace-nowrap px-4 py-2.5 text-sm">Subscribe</button>
            </div>
          </div>
        </div>

        <LotusDivider className="mb-6 mt-10" />
        <div className="flex flex-col items-center justify-between gap-4 text-xs text-[#6B6560] sm:flex-row">
          <p>&copy; {new Date().getFullYear()} PRCJ Fine Jewellery. Since 1997. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {CERTIFICATIONS.map((cert) => (
              <span key={cert} className="rounded border border-[#C9933A]/20 px-2 py-1 text-[10px] uppercase tracking-wider text-[#C9933A]">
                {cert}
              </span>
            ))}
          </div>
          <div className="flex gap-4">
            <Link href="/privacy" className="transition-colors hover:text-[#C9933A]">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-[#C9933A]">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
