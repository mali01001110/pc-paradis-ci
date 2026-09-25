import { Routes, Route } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import HomePage from '@/pages/HomePage'
import ShopPage from '@/pages/ShopPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import LoginPage from '@/pages/auth/LoginPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
import DashboardLayout from '@/layouts/DashboardLayout'
import DashboardHome from '@/pages/seller/DashboardHome'
import MyShopPage from '@/pages/seller/MyShopPage'
import MyProductsPage from '@/pages/seller/MyProductsPage'
import ProductFormPage from '@/pages/seller/ProductFormPage'
import ProductDetailPage from '@/pages/ProductDetailPage'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop/:slug" element={<ShopPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      </Route>

      {/* Seller dashboard routes */}
      <Route path="/seller" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="shop" element={<MyShopPage />} />
        <Route path="products" element={<MyProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:id/edit" element={<ProductFormPage />} />
      </Route>
    </Routes>
  )
}