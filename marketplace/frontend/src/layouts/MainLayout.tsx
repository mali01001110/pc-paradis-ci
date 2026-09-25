import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Moon, Sun, Menu, X, ShoppingCart } from 'lucide-react'
import { useState } from 'react'

export default function MainLayout() {
  const { seller, logoutMutation } = useAuth()
  const navigate = useNavigate()
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  )
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleDark = () => {
    document.documentElement.classList.toggle('dark', !dark)
    setDark(!dark)
  }

  const handleLogout = () => {
    const refresh = localStorage.getItem('refresh_token')
    if (refresh) logoutMutation.mutate(refresh)
    else navigate('/')
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0a1e] transition-colors">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-[#0f0a1e]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="font-display font-bold text-lg text-gray-900 dark:text-white">
                PC<span className="text-primary-600">Paradis</span> CI
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Explorer
              </Link>
              <Link to="/?cat=gpu" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Cartes graphiques
              </Link>
              <Link to="/?cat=cpu" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Processeurs
              </Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleDark}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {dark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {seller ? (
                <div className="flex items-center gap-3">
                  <Link to="/seller" className="btn-secondary text-sm py-2 px-4">
                    Mon espace
                  </Link>
                  <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    Déconnexion
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/auth/login" className="hidden sm:inline-flex btn-secondary text-sm py-2 px-4">
                    Connexion
                  </Link>
                  <Link to="/auth/register" className="btn-primary text-sm py-2 px-4">
                    Vendre gratuitement
                  </Link>
                </>
              )}

              <button
                className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-[#0f0a1e] px-4 py-4 space-y-2">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-gray-600 dark:text-gray-300 py-2">
              Explorer
            </Link>
            <Link to="/?cat=gpu" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-gray-600 dark:text-gray-300 py-2">
              Cartes graphiques
            </Link>
            <Link to="/?cat=cpu" onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-gray-600 dark:text-gray-300 py-2">
              Processeurs
            </Link>
            {!seller && (
              <div className="pt-2 flex flex-col gap-2">
                <Link to="/auth/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-sm py-2">
                  Connexion
                </Link>
                <Link to="/auth/register" onClick={() => setMenuOpen(false)} className="btn-primary text-sm py-2">
                  Vendre gratuitement
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Page content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="font-display font-bold text-gray-900 dark:text-white">
                  PC<span className="text-primary-600">Paradis</span> CI
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                La marketplace référence pour le hardware PC et gaming en Côte d'Ivoire. Gratuit pour les vendeurs.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Catégories</h4>
                <ul className="space-y-2">
                  <li><Link to="/?cat=cpu" className="text-gray-500 dark:text-gray-400 hover:text-primary-600">Processeurs</Link></li>
                  <li><Link to="/?cat=gpu" className="text-gray-500 dark:text-gray-400 hover:text-primary-600">Cartes graphiques</Link></li>
                  <li><Link to="/?cat=ram" className="text-gray-500 dark:text-gray-400 hover:text-primary-600">RAM</Link></li>
                  <li><Link to="/?cat=storage" className="text-gray-500 dark:text-gray-400 hover:text-primary-600">Stockage</Link></li>
                  <li><Link to="/?cat=peripherals" className="text-gray-500 dark:text-gray-400 hover:text-primary-600">Périphériques</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Compte</h4>
                <ul className="space-y-2">
                  <li><Link to="/auth/register" className="text-gray-500 dark:text-gray-400 hover:text-primary-600">Créer un espace</Link></li>
                  <li><Link to="/auth/login" className="text-gray-500 dark:text-gray-400 hover:text-primary-600">Connexion</Link></li>
                  <li><Link to="/seller" className="text-gray-500 dark:text-gray-400 hover:text-primary-600">Mon espace</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} PC Paradis CI — Toutes les annonces sont gratuites pour les vendeurs.
          </div>
        </div>
      </footer>
    </div>
  )
}