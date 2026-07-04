import { Link } from '@/lib/router.jsx';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Gem, ShieldCheck, Sparkles } from 'lucide-react';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1800&q=88';

const FEATURED_PIECES = [
  {
    title: 'Temple Bridal Sets',
    caption: 'Nakshi work in 22K gold',
    href: '/shop?collection=bridal',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=86',
  },
  {
    title: 'Kundan Earrings',
    caption: 'Festive pieces with meenakari',
    href: '/shop?q=kundan%20earrings',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=700&q=86',
  },
  {
    title: 'Diamond Rings',
    caption: 'Everyday brilliance',
    href: '/shop?q=diamond%20ring',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=700&q=86',
  },
];

const TRUST = [
  { icon: ShieldCheck, label: 'BIS Hallmarked' },
  { icon: BadgeCheck, label: 'Certified Stones' },
  { icon: Gem, label: 'Artisan Crafted' },
];

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-[#120b0b] text-white">
      <div className="absolute inset-0">
        <img src={HERO_IMAGE} alt="Diamond and gold jewellery" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,11,11,0.92)_0%,rgba(18,11,11,0.74)_42%,rgba(18,11,11,0.18)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#FEFDF9] via-[#FEFDF9]/35 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-112px)] max-w-7xl grid-rows-[1fr_auto] px-4 pt-14 sm:px-6 lg:min-h-[calc(100vh-120px)]">
        <div className="grid items-center gap-10 py-16 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <p className="mb-5 flex items-center gap-3 text-xs uppercase tracking-[0.34em] text-[#E8C97A]">
              <span className="h-px w-10 bg-[#C9933A]" />
              PRCJ jewellery since 1997
            </p>
            <h1 className="max-w-4xl text-[clamp(3.6rem,9vw,8.9rem)] font-semibold leading-[0.86] text-[#FEFDF9]">
              Grace in every ornament
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#eee5d3] sm:text-lg">
              PRCJ imagines and crafts gold, platinum, silver, kundan, polki and diamond jewellery for weddings, festivals and the heirlooms you keep closest.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-gold rounded-full px-7 py-3">
                Shop Collection
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/tryon"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E8C97A]/55 bg-white/8 px-7 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-[#F9E8B5] backdrop-blur-md transition hover:border-[#E8C97A] hover:bg-white/14"
              >
                <Sparkles size={16} />
                Virtual Try-On
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden justify-end lg:flex"
          >
            <div className="w-full max-w-sm border border-white/16 bg-white/10 p-3 shadow-2xl backdrop-blur-xl">
              <img
                src="https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?auto=format&fit=crop&w=900&q=86"
                alt="Gold necklace detail"
                className="aspect-[4/5] w-full object-cover"
              />
              <div className="flex items-center justify-between px-2 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-[#E8C97A]">Signature edit</p>
                  <p className="mt-1 font-display text-2xl text-white">Royal by PRCJ</p>
                </div>
                <Link href="/shop?collection=bridal" className="rounded-full bg-[#FEFDF9] px-4 py-2 text-xs font-semibold text-[#1a0e0e]">
                  View
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="pb-6"
        >
          <div className="grid gap-3 md:grid-cols-[0.8fr_2fr] md:items-end">
            <div className="flex flex-wrap gap-2">
              {TRUST.map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-full border border-white/14 bg-white/10 px-3 py-2 text-xs text-[#F9E8B5] backdrop-blur-md">
                  <Icon size={14} />
                  {label}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {FEATURED_PIECES.map((piece) => (
                <Link
                  key={piece.title}
                  href={piece.href}
                  className="group grid grid-cols-[82px_1fr] items-center gap-3 bg-[#FEFDF9] p-2 text-[#1a0e0e] shadow-[0_18px_50px_rgba(28,12,12,0.16)] transition duration-300 hover:-translate-y-1"
                >
                  <img src={piece.image} alt={piece.title} className="aspect-square w-full object-cover" />
                  <span>
                    <span className="block text-[10px] uppercase tracking-[0.22em] text-[#A8771F]">{piece.caption}</span>
                    <span className="mt-1 flex items-center gap-2 font-display text-xl leading-none">
                      {piece.title}
                      <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
