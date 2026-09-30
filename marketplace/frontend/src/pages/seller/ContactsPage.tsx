import { useQuery } from '@tanstack/react-query'
import { Phone, MessageCircle, Users, Loader2 } from 'lucide-react'
import { contactService, type ContactEvent, type ContactStat } from '@/services/productService'

export default function ContactsPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['contact-stats'],
    queryFn: async () => (await contactService.getStats()).data,
  })

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => (await contactService.getContacts()).data,
  })

  if (statsLoading || eventsLoading) {
    return (
      <div className="p-8 text-gray-400 flex items-center gap-2">
        <Loader2 size={18} className="animate-spin" /> Chargement…
      </div>
    )
  }

  const totalPhone = (stats ?? []).reduce((sum, s) => sum + s.phone_contacts, 0)
  const totalWhatsapp = (stats ?? []).reduce((sum, s) => sum + s.whatsapp_contacts, 0)
  const totalViews = (stats ?? []).reduce((sum, s) => sum + s.views_count, 0)
  const totalContacts = (stats ?? []).reduce((sum, s) => sum + s.total_contacts, 0)

  const statsCards = [
    { label: 'Contacts totaux', value: totalContacts, icon: Users, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' },
    { label: 'Appels (téléphone)', value: totalPhone, icon: Phone, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
    { label: 'Messages WhatsApp', value: totalWhatsapp, icon: MessageCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Vues produits', value: totalViews, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  ]

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-display">Contacts</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Suivi des contacts reçus sur vos annonces (appels et WhatsApp).
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statsCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="card p-5">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
                <Icon size={20} />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{card.label}</div>
            </div>
          )
        })}
      </div>

      {/* Per-product stats */}
      {(stats ?? []).length > 0 && (
        <div className="card p-6 mb-8">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Performance par produit</h2>
          <div className="space-y-3">
            {stats?.map((s: ContactStat) => (
              <div key={s.id} className="flex items-center justify-between gap-4 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.title}</div>
                  <div className="text-xs text-gray-400">{s.views_count} vues</div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                    <Phone size={13} /> {s.phone_contacts}
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <MessageCircle size={13} /> {s.whatsapp_contacts}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact history */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Historique des contacts</h2>
        {(events ?? []).length === 0 ? (
          <p className="text-sm text-gray-400">Aucun contact pour le moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 pr-4 font-medium">Produit</th>
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {(events ?? []).map((evt: ContactEvent) => (
                  <tr key={evt.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <td className="py-3 pr-4 text-gray-900 dark:text-white">{evt.product_title}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${evt.contact_type === 'PHONE' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                        {evt.contact_type === 'PHONE' ? <Phone size={11} /> : <MessageCircle size={11} />}
                        {evt.contact_type === 'PHONE' ? 'Appel' : 'WhatsApp'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">{formatDate(evt.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
