import { HeroBanner } from '@/components/home/HeroBanner';
import { ShopByGender } from '@/components/home/ShopByGender';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { TryOnHighlight } from '@/components/home/TryOnHighlight';
import { BrandStory } from '@/components/home/BrandStory';

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <ShopByGender />
      <FeaturedProducts
        title="New Arrivals"
        subtitle="Fresh from the karigar bench"
        type="new"
        viewAllHref="/shop?sort=newest"
      />
      <TryOnHighlight />
      <FeaturedProducts
        title="Most Loved Pieces"
        subtitle="Chosen for weddings, gifting and everyday wear"
        type="bestsellers"
        viewAllHref="/shop?sort=popular"
      />
      <BrandStory />
    </>
  );
}
