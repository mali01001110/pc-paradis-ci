import { Link } from 'react-router-dom'
import { ExternalLink, MessageCircle } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { useT } from '@/i18n'
import { normalizePhone } from '@/lib/phone'

interface SellerCardProps {
  name: string
  city?: string
  whatsapp?: string
  phone?: string
  shopSlug?: string
  className?: string
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

/**
 * Compact seller identity block: avatar/initials, display name, optional city,
 * shop link and WhatsApp CTA. Used on product detail pages (and reusable
 * anywhere a seller needs a compact representation).
 */
export function SellerCard({ name, city, whatsapp, phone, shopSlug, className }: SellerCardProps) {
  const { t } = useT()
  const slug = shopSlug ?? slugify(name)
  const waNumber = (whatsapp || phone) && normalizePhone(whatsapp || phone!)
  const waHref = waNumber
    ? `https://wa.me/${waNumber.replace('+', '')}?text=${encodeURIComponent(
        `Bonjour, je suis intéressé par vos produits sur PC Paradis CI.`
      )}`
    : null

  return (
    <div className={className}>
      <div className="flex items-center gap-3">
        <Avatar name={name} size="md" />
        <div className="min-w-0">
          <div className="font-semibold text-gray-900 dark:text-white truncate">{name}</div>
          {city && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{city}</div>
          )}
          <Link
            to={`/shop/${slug}`}
            className="text-xs text-primary-600 dark:text-primary-400 flex items-center gap-1"
          >
            {t('product.viewShop')} <ExternalLink size={11} />
          </Link>
        </div>
        {waHref && (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs font-medium"
            style={{ color: '#128C7E' }}
            aria-label={`${t('product.whatsapp')} — ${name}`}
          >
            <MessageCircle size={18} />
          </a>
        )}
      </div>
    </div>
  )
}
