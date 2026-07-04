import { Link } from '@/lib/router.jsx';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const COLLECTIONS = [
  {
    title: 'Bridal Collections',
    eyebrow: 'Kundan · Polki · Temple sets',
    href: '/shop?collection=bridal',
    image: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=900&q=86',
    large: true,
  },
  {
    title: 'Glory Collections',
    eyebrow: 'Platinum · Silver · Stones',
    href: '/shop?collection=glory',
    image: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=700&q=86',
  },
  {
    title: 'Royal',
    eyebrow: 'Statement sets · Rajwada finish',
    href: '/shop?collection=royal',
    image: 'https://images.unsplash.com/photo-1633810542706-90e5ff7557be?auto=format&fit=crop&w=700&q=86',
  },
  {
    title: 'Men Collections',
    eyebrow: 'Kadas · Chains · Rings',
    href: '/shop?gender=men',
    image: 'https://images.unsplash.com/photo-1619119069152-a2b331eb392a?auto=format&fit=crop&w=700&q=86',
  },
  {
    title: 'Revolution Collections',
    eyebrow: 'Modern cuts · Bold silhouettes',
    href: '/shop?collection=revolution',
    image: 'https://images.unsplash.com/photo-1531995811006-35cb42e1a022?auto=format&fit=crop&w=700&q=86',
  },
];

export function ShopByGender() {
  return (
    <section className="bg-[#FEFDF9] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.34em] text-[#A8771F]">PRCJ collections</p>
            <h2 className="heading-xl max-w-2xl text-[#1a0e0e]">Signature lines made for Indian celebrations and modern elegance.</h2>
          </div>
          <Link href="/shop" className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#6B1E1E]">
            View all collections
            <ArrowRight size={16} className="transition group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid auto-rows-[260px] gap-4 lg:grid-cols-4">
          {COLLECTIONS.map((collection, index) => (
            <motion.div
              key={collection.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className={collection.large ? 'lg:col-span-2 lg:row-span-2' : ''}
            >
              <Link href={collection.href} className="group relative block h-full overflow-hidden bg-[#1a0e0e]">
                <img src={collection.image} alt={collection.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0e0e]/86 via-[#1a0e0e]/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-[#E8C97A]">{collection.eyebrow}</p>
                  <div className="flex items-end justify-between gap-4">
                    <h3 className="font-display text-3xl leading-none text-white sm:text-4xl">{collection.title}</h3>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#FEFDF9] text-[#1a0e0e] transition group-hover:bg-[#E8C97A]">
                      <ArrowRight size={18} />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
