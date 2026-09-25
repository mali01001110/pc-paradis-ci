import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Package, Eye, Phone, MessageCircle, PlusCircle, TrendingUp } from 'lucide-react'
import { contactService } from '@/services/productService'

export default function DashboardHome() {
  const { data: stats } = useQuery({
    queryKey: ['contact-stats'],
    queryFn: async () => (await contactService.getStats()).data,
  })

  const totalProducts = stats?.length ?? 0
  const totalViews = (stats ?? []).reduce((acc, s) => acc + s.views_count, 0)
  const totalPhone = (stats ?? []).reduce((acc, s) => acc + s.phone_contacts, 0)
  const totalWhatsapp = (stats ?? []).reduce((acc, s) => acc + s.whatsapp_contacts, 0)

  const values: Record<string, string> = {
    products: String(totalProducts),
    views: totalViews.toLocaleString('fr-FR'),
    phone: String(totalPhone),
    whatsapp: String(totalWhatsapp),
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">
            Vue générale
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Bienvenue sur votre espace vendeur. Publiez vos produits gratuitement.
          </p>
        </div>
        <Link to="/seller/products/new" className="btn-primary">
          <PlusCircle size={16} />
          Nouvelle annonce
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Produits publiés', value: values.products, icon: Package, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
          { label: 'Vues totales', value: values.views, icon: TrendingUp, color: 'text-green-600 bg-green-50 dark:bg-green-900/30' },
          { label: 'Appels reçus', value: values.phone, icon: Phone, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' },
          { label: 'WhatsApp', value: values.whatsapp, icon: MessageCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white font-display">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Top products */}
      {stats && stats.length > 0 && (
        <div className="card p-6 mb-8">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Performances par produit</h2>
          <div className="space-y-2">
            {stats.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 text-sm"
              >
                <span className="font-medium text-gray-900 dark:text-white truncate flex-1 mr-4">
                  {s.title}
                </span>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                  <span className="inline-flex items-center gap-1">
                    <Eye size={12} /> {s.views_count}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Phone size={12} /> {s.phone_contacts}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle size={12} /> {s.whatsapp_contacts}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/seller/products/new" className="card p-5 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-3">
            <PlusCircle size={20} className="text-primary-600" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Publier une annonce</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gratuit, sans commission. Disponible immédiatement.</p>
        </Link>

        <Link to="/seller/shop" className="card p-5 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-3">
            <Package size={20} className="text-primary-600" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Modifier ma boutique</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Mettez à jour vos informations et votre logo.</p>
        </Link>

        <Link to="/seller/security" className="card p-5 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-green-600">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Sécurité</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Activez l'authentification à deux facteurs.</p>
        </Link>
      </div>

      {/* Empty state / getting started */}
      {totalProducts === 0 && (
        <div className="card p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
            <Package size={32} className="text-primary-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Pas encore d'annonces ?</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
            Publiez votre premier produit et commencez à recevoir des contacts par téléphone ou WhatsApp. C'est 100% gratuit.
          </p>
          <Link to="/seller/products/new" className="btn-primary px-8">
            <PlusCircle size={16} />
            Créer ma première annonce
          </Link>
        </div>
      )}
    </div>
  )
}
