import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import HomePage from '@/pages/HomePage'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AdminRoute } from '@/components/AdminRoute'

const PageLoading = () => (
  <div className="min-h-[60vh] flex items-center justify-center text-gray-400 animate-pulse">
    Chargement…
  </div>
)

// Public routes — lazy-loaded (HomePage + MainLayout stay in the initial chunk).
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'))
const ShopPage = lazy(() => import('@/pages/ShopPage'))
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'))
const SellersPage = lazy(() => import('@/pages/SellersPage'))
const CatalogPage = lazy(() => import('@/pages/CatalogPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'))
const PasswordResetPage = lazy(() => import('@/pages/auth/PasswordResetPage'))
const PasswordResetConfirmPage = lazy(() => import('@/pages/auth/PasswordResetConfirmPage'))

// Seller dashboard routes — lazy-loaded.
const DashboardLayout = lazy(() => import('@/layouts/DashboardLayout'))
const DashboardHome = lazy(() => import('@/pages/seller/DashboardHome'))
const MyShopPage = lazy(() => import('@/pages/seller/MyShopPage'))
const MyProductsPage = lazy(() => import('@/pages/seller/MyProductsPage'))
const ProductFormPage = lazy(() => import('@/pages/seller/ProductFormPage'))
const ProfilePage = lazy(() => import('@/pages/seller/ProfilePage'))
const SecurityPage = lazy(() => import('@/pages/seller/SecurityPage'))
const ContactsPage = lazy(() => import('@/pages/seller/ContactsPage'))
const SellerAnalyticsPage = lazy(() => import('@/pages/seller/AnalyticsPage'))
const SettingsPage = lazy(() => import('@/pages/seller/SettingsPage'))

// Admin routes — lazy-loaded.
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'))
const ModerationQueuePage = lazy(() => import('@/pages/admin/ModerationQueuePage'))
const SellersManagementPage = lazy(() => import('@/pages/admin/SellersManagementPage'))
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage'))
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'))

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/categories"
          element={
            <Suspense fallback={<PageLoading />}>
              <CategoriesPage />
            </Suspense>
          }
        />
        <Route
          path="/products"
          element={
            <Suspense fallback={<PageLoading />}>
              <CatalogPage />
            </Suspense>
          }
        />
        <Route
          path="/sellers"
          element={
            <Suspense fallback={<PageLoading />}>
              <SellersPage />
            </Suspense>
          }
        />
        <Route
          path="/shop/:slug"
          element={
            <Suspense fallback={<PageLoading />}>
              <ShopPage />
            </Suspense>
          }
        />
        {/* Legacy slug-only detail kept for old links; canonical is /products/:category/:slug */}
        <Route
          path="/products/:productSlug"
          element={
            <Suspense fallback={<PageLoading />}>
              <ProductDetailPage />
            </Suspense>
          }
        />
        <Route
          path="/products/:categorySlug/:productSlug"
          element={
            <Suspense fallback={<PageLoading />}>
              <ProductDetailPage />
            </Suspense>
          }
        />
        <Route path="/auth/register" element={<Suspense fallback={<PageLoading />}><RegisterPage /></Suspense>} />
        <Route path="/auth/login" element={<Suspense fallback={<PageLoading />}><LoginPage /></Suspense>} />
        <Route path="/auth/password-reset" element={<Suspense fallback={<PageLoading />}><PasswordResetPage /></Suspense>} />
        <Route path="/auth/password-reset/:code" element={<Suspense fallback={<PageLoading />}><PasswordResetConfirmPage /></Suspense>} />
        <Route path="/verify-email/:token" element={<Suspense fallback={<PageLoading />}><VerifyEmailPage /></Suspense>} />
      </Route>

      {/* Seller dashboard routes */}
      <Route path="/seller" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="shop" element={<MyShopPage />} />
        <Route path="products" element={<MyProductsPage />} />
        <Route path="products/new" element={<ErrorBoundary><ProductFormPage /></ErrorBoundary>} />
        <Route
          path="products/:id/edit"
          element={<ErrorBoundary><ProductFormPage /></ErrorBoundary>}
        />
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
            <Suspense fallback={<PageLoading />}>
              <AdminLayout />
            </Suspense>
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
