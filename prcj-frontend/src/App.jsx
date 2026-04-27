import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Providers } from '@/lib/providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';

import HomePage from '@/app/page';
import ShopPage from '@/app/shop/page';
import ProductPage from '@/app/shop/[slug]/page';
import CartPage from '@/app/cart/page';
import CheckoutPage from '@/app/checkout/page';
import LoginPage from '@/app/auth/login/page';
import RegisterPage from '@/app/auth/register/page';
import WishlistPage from '@/app/account/wishlist/page';
import ProfilePage from '@/app/account/profile/page';
import OrdersPage from '@/app/account/orders/page';
import TryOnPage from '@/app/tryon/[slug]/page';
import AdminLayout from '@/app/admin/layout';
import AdminDashboardPage from '@/app/admin/page';
import AdminProductsPage from '@/app/admin/products/page';
import AdminOrdersPage from '@/app/admin/orders/page';
import AdminAnalyticsPage from '@/app/admin/analytics/page';

function ShellLayout() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-80px)]">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}

export default function App() {
  return (
    <Providers>
      <Routes>
        <Route element={<ShellLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:slug" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/account" element={<Navigate to="/account/profile" replace />} />
          <Route path="/account/profile" element={<ProfilePage />} />
          <Route path="/account/orders" element={<OrdersPage />} />
          <Route path="/account/wishlist" element={<WishlistPage />} />
          <Route path="/tryon" element={<Navigate to="/shop" replace />} />
          <Route path="/tryon/:slug" element={<TryOnPage />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Providers>
  );
}
