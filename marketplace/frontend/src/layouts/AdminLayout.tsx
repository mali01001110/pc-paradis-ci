import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Package,
  Users,
  AlertTriangle,
  BarChart3,
  ArrowLeft,
  LogOut,
  Shield,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { authService, clearTokens } from '@/services/api'
import { useMutation } from '@tanstack/react-query'

const ADMIN_NAV = [
  { to: '/admin/products', icon: Package, label: 'Modération produits' },
  { to: '/admin/sellers', icon: Users, label: 'Vendeurs' },
  { to: '/admin/reports', icon: AlertTriangle, label: 'Signalements' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Statistiques' },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { seller } = useAuth()

  const logoutMutation = useMutation({
    mutationFn: (refresh: string) => authService.logout(refresh),
    onSettled: () => {
      clearTokens()
      navigate('/')
    },
  })

  const handleLogout = () => {
    const refresh = localStorage.getItem('refresh_token')
    if (refresh) logoutMutation.mutate(refresh)
    else navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0515] flex">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-gray-900 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-gray-800">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-sm text-white">
                PC<span className="text-primary-400">Paradis</span>
              </span>
              <div className="text-[10px] text-primary-400 font-medium">Administration</div>
            </div>
          </Link>
        </div>

        {/* Admin info */}
        <div className="p-4 border-b border-gray-800">
          <div className="text-sm font-semibold text-white truncate">
            {seller?.business_name || seller?.email}
          </div>
          <div className="text-xs text-gray-500 truncate">{seller?.email}</div>
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary-900/60 text-primary-300 border border-primary-700">
              <Shield size={10} />
              Administrateur
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 space-y-1">
          <Link
            to="/seller"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Espace vendeur
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-gray-800 transition-colors"
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