import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  Package,
  LayoutDashboard,
  PlusCircle,
  User,
  Shield,
  LogOut,
  Store,
  Phone,
  BarChart3,
  Settings,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const NAV = [
  { to: '/seller', icon: LayoutDashboard, label: 'Vue générale', end: true },
  { to: '/seller/shop', icon: Store, label: 'Ma boutique' },
  { to: '/seller/products', icon: Package, label: 'Mes produits' },
  { to: '/seller/products/new', icon: PlusCircle, label: 'Ajouter un produit' },
  { to: '/seller/analytics', icon: BarChart3, label: 'Statistiques' },
  { to: '/seller/contacts', icon: Phone, label: 'Contacts' },
  { to: '/seller/profile', icon: User, label: 'Mon profil' },
  { to: '/seller/security', icon: Shield, label: 'Sécurité' },
  { to: '/seller/settings', icon: Settings, label: 'Paramètres' },
]

export default function DashboardLayout() {
  const location = useLocation()
  const { seller, logoutMutation } = useAuth()

  const handleLogout = () => {
    const refresh = localStorage.getItem('refresh_token')
    if (refresh) logoutMutation.mutate(refresh)
    else window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0515] flex">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 hidden lg:flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display font-bold text-sm text-gray-900 dark:text-white">
              PC<span className="text-primary-600">Paradis</span>
            </span>
          </Link>
        </div>

        {/* Seller info */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {seller?.business_name || seller?.email}
          </div>
          <div className="text-xs text-gray-400 mt-0.5 truncate">{seller?.email}</div>
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              seller?.mfa_enabled
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${seller?.mfa_enabled ? 'bg-green-500' : 'bg-yellow-500'}`} />
              {seller?.mfa_enabled ? 'MFA activée' : 'MFA non activée'}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
          {seller?.is_staff && (
            <Link
              to="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-600 dark:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
            >
              <Shield size={16} />
              Administration
            </Link>
          )}
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
            ← Retour au site
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}