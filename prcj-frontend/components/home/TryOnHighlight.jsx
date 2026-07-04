import { Link } from '@/lib/router.jsx';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, Sparkles, WandSparkles } from 'lucide-react';

const SERVICES = [
  'Live necklace and earring preview',
  'Match jewellery with saree and lehenga tones',
  'Private styling appointment available',
];

export function TryOnHighlight() {
  return (
    <section className="bg-[#17100f] py-20 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <p className="mb-3 flex items-center gap-3 text-xs uppercase tracking-[0.34em] text-[#E8C97A]">
            <span className="h-px w-10 bg-[#C9933A]" />
            Concierge try-on
          </p>
          <h2 className="heading-xl max-w-2xl text-white">See the piece on you before the occasion arrives.</h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-[#cfc4b2]">
            Preview select pieces with our virtual try-on and book a calm styling session for bridal layering, festival gifting or custom sizing.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {SERVICES.map((service) => (
              <div key={service} className="border border-white/12 bg-white/[0.06] p-4 backdrop-blur-md">
                <WandSparkles size={18} className="mb-4 text-[#E8C97A]" />
                <p className="text-sm leading-6 text-[#F8F4E8]">{service}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/tryon" className="btn-gold rounded-full px-7 py-3">
              <Camera size={16} />
              Start Try-On
            </Link>
            <Link href="/shop?has_3d=true" className="inline-flex items-center gap-2 rounded-full border border-white/18 px-7 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-[#F9E8B5] transition hover:border-[#E8C97A]">
              Try-on pieces
              <ArrowRight size={16} />
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="relative min-h-[460px] overflow-hidden"
        >
          <img
            src="https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1100&q=86"
            alt="Indian bridal styling with jewellery"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#17100f]/80 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 border border-white/18 bg-[#17100f]/74 p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2 text-[#E8C97A]">
              <Sparkles size={16} />
              <span className="text-xs uppercase tracking-[0.22em]">Stylist pick</span>
            </div>
            <p className="font-display text-3xl leading-tight">Layer a choker, rani haar and jhumkas without guessing proportions.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
