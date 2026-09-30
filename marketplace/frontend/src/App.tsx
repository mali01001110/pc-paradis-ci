import { Routes, Route } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import HomePage from '@/pages/HomePage'
import ShopPage from '@/pages/ShopPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import LoginPage from '@/pages/auth/LoginPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
import PasswordResetPage from '@/pages/auth/PasswordResetPage'
import PasswordResetConfirmPage from '@/pages/auth/PasswordResetConfirmPage'
import DashboardLayout from '@/layouts/DashboardLayout'
import AdminLayout from '@/layouts/AdminLayout'
import DashboardHome from '@/pages/seller/DashboardHome'
import MyShopPage from '@/pages/seller/MyShopPage'
import MyProductsPage from '@/pages/seller/MyProductsPage'
import ProductFormPage from '@/pages/seller/ProductFormPage'
import ProfilePage from '@/pages/seller/ProfilePage'
import SecurityPage from '@/pages/seller/SecurityPage'
import ContactsPage from '@/pages/seller/ContactsPage'
import SellerAnalyticsPage from '@/pages/seller/AnalyticsPage'
import SettingsPage from '@/pages/seller/SettingsPage'
import ProductDetailPage from '@/pages/ProductDetailPage'
import CatalogPage from '@/pages/CatalogPage'
import SellersPage from '@/pages/SellersPage'
import ModerationQueuePage from '@/pages/admin/ModerationQueuePage'
import SellersManagementPage from '@/pages/admin/SellersManagementPage'
import ReportsPage from '@/pages/admin/ReportsPage'
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage'
import { AdminRoute } from '@/components/AdminRoute'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<CatalogPage />} />
        <Route path="/sellers" element={<SellersPage />} />
        <Route path="/shop/:slug" element={<ShopPage />} />
        {/* Legacy slug-only detail kept for old links; canonical is /products/:category/:slug */}
        <Route path="/products/:productSlug" element={<ProductDetailPage />} />
        <Route path="/products/:categorySlug/:productSlug" element={<ProductDetailPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/password-reset" element={<PasswordResetPage />} />
        <Route path="/auth/password-reset/:code" element={<PasswordResetConfirmPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      </Route>

      {/* Seller dashboard routes */}
      <Route path="/seller" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="shop" element={<MyShopPage />} />
        <Route path="products" element={<MyProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:id/edit" element={<ProductFormPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="security" element={<SecurityPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="analytics" element={<SellerAnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Admin routes (staff only) */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<ModerationQueuePage />} />
        <Route path="products" element={<ModerationQueuePage />} />
        <Route path="sellers" element={<SellersManagementPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="analytics" element={<AdminAnalyticsPage />} />
      </Route>
    </Routes>
  )
}