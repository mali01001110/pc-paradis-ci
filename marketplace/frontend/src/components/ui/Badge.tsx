import type { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full',
  {
    variants: {
      variant: {
        neutral: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        success: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
        warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
        danger: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
        info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
        primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
)

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: ReactNode
  className?: string
}

export function Badge({ variant, className, children }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)}>{children}</span>
}
