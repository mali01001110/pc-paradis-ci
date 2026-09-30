import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/Dialog'
import { productService } from '@/services/productService'
import { getErrorMessage } from '@/services/api'
import { useToast } from '@/components/ui/Toast'
import { REPORT_REASON_LABELS, type ReportReason } from '@/types/admin'

const REASONS: ReportReason[] = [
  'PROHIBITED',
  'FRAUD',
  'FALSE_INFO',
  'MISLEADING',
  'SPAM',
  'INAPPROPRIATE',
  'OTHER',
]

interface ReportProductDialogProps {
  productSlug: string
}

export function ReportProductDialog({ productSlug }: ReportProductDialogProps) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason>('OTHER')
  const [description, setDescription] = useState('')
  const [reporterEmail, setReporterEmail] = useState('')

  const reportMutation = useMutation({
    mutationFn: () =>
      productService.reportProduct(productSlug, {
        reason,
        description: description || undefined,
        reporter_email: reporterEmail || undefined,
      }),
    onSuccess: () => {
      toast.success("Signalement envoyé. Notre équipe va l'examiner.")
      setOpen(false)
      setDescription('')
      setReporterEmail('')
      setReason('OTHER')
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
            <path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Signaler
        </button>
      </DialogTrigger>

      <DialogContent title="Signaler cette annonce" description="Aidez-nous à garder la plateforme fiable.">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            reportMutation.mutate()
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="report-reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Motif
            </label>
            <select
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {REPORT_REASON_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="report-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Détails <span className="text-gray-400">(facultatif)</span>
            </label>
            <textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Précisez la nature du problème…"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          <div>
            <label htmlFor="report-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email <span className="text-gray-400">(facultatif)</span>
            </label>
            <input
              id="report-email"
              type="email"
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <button
            type="submit"
            disabled={reportMutation.isPending}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {reportMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Envoi…
              </>
            ) : (
              'Envoyer le signalement'
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}