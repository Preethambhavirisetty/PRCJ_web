import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { HeroBanner } from '@/components/home/HeroBanner';
import { ShopByGender } from '@/components/home/ShopByGender';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { TryOnHighlight } from '@/components/home/TryOnHighlight';
import { BrandStory } from '@/components/home/BrandStory';
import { GoldDivider } from '@/components/brand';
export default function HomePage() {
    return (_jsxs(_Fragment, { children: [_jsx(HeroBanner, {}), _jsx(ShopByGender, {}), _jsx(GoldDivider, {}), _jsx(FeaturedProducts, { title: "Featured Collection", subtitle: "Hand-picked for you", type: "featured", viewAllHref: "/shop?featured=true" }), _jsx(GoldDivider, {}), _jsx(TryOnHighlight, {}), _jsx(GoldDivider, {}), _jsx(FeaturedProducts, { title: "New Arrivals", subtitle: "Just landed", type: "new", viewAllHref: "/shop?sort=newest" }), _jsx(GoldDivider, {}), _jsx(FeaturedProducts, { title: "Best Sellers", subtitle: "Most loved", type: "bestsellers", viewAllHref: "/shop?sort=popular" }), _jsx(GoldDivider, {}), _jsx(BrandStory, {})] }));
}
