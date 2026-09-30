import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg border bg-white dark:bg-gray-900 px-3.5 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors duration-200',
        error
          ? 'border-red-400 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20'
          : 'border-gray-300 dark:border-gray-700 focus:border-primary-500 focus:ring-primary-500/20',
        className
      )}
      {...props}
    />
  )
)

Input.displayName = 'Input'
