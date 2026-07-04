import { motion } from 'framer-motion';
import { BadgeCheck, Gem, HandHeart, Mail, Phone, ShieldCheck } from 'lucide-react';

const VALUES = [
  {
    icon: ShieldCheck,
    title: 'BIS Hallmarked Gold',
    desc: 'Every gold piece is purity marked and checked before it reaches your home.',
  },
  {
    icon: Gem,
    title: 'Certified Stones',
    desc: 'Diamonds and precious gemstones are sourced with transparent certification.',
  },
  {
    icon: HandHeart,
    title: 'Handmade in India',
    desc: 'Kundan, polki, temple and jadau work are finished by experienced karigars.',
  },
  {
    icon: BadgeCheck,
    title: 'Lifetime Care',
    desc: 'Sizing, polishing and care guidance keep your heirlooms occasion-ready.',
  },
];

export function BrandStory() {
  return (
    <section className="bg-[#F4EFE4] py-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.34em] text-[#A8771F]">The PRCJ promise</p>
          <h2 className="heading-xl text-[#1a0e0e]">Luxury should feel personal, transparent and unhurried.</h2>
          <p className="mt-5 text-base leading-7 text-[#6B6560]">
            Since 1997, PRCJ has imagined jewellery around Indian occasions: the bridal morning, the first festival at home, the family gift, the everyday chain that never leaves you. Each piece is chosen for craft, comfort and long-term value.
          </p>
          <div className="mt-7 space-y-3 text-sm font-medium text-[#3D1010]">
            <a href="tel:+919010186899" className="flex items-center gap-3 transition hover:text-[#A8771F]">
              <Phone size={16} className="text-[#A8771F]" />
              +91 90101 86899
            </a>
            <a href="mailto:prcjewelery@gmail.com" className="flex items-center gap-3 transition hover:text-[#A8771F]">
              <Mail size={16} className="text-[#A8771F]" />
              prcjewelery@gmail.com
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {VALUES.map(({ icon: Icon, title, desc }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="border border-[#D8C292] bg-[#FEFDF9] p-6 shadow-[0_14px_40px_rgba(71,43,16,0.06)]"
            >
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-full bg-[#6B1E1E] text-[#F9E8B5]">
                <Icon size={20} />
              </div>
              <h3 className="font-display text-2xl leading-none text-[#1a0e0e]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#6B6560]">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
