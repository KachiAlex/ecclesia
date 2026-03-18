import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'success' | 'error' | 'info' | 'warning'
  message?: string
  onClose?: () => void
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, type = 'info', message, onClose, ...props }, ref) => {
    const bgColor = {
      success: 'bg-green-50 dark:bg-green-900',
      error: 'bg-red-50 dark:bg-red-900',
      info: 'bg-blue-50 dark:bg-blue-900',
      warning: 'bg-yellow-50 dark:bg-yellow-900',
    }[type]

    const textColor = {
      success: 'text-green-800 dark:text-green-200',
      error: 'text-red-800 dark:text-red-200',
      info: 'text-blue-800 dark:text-blue-200',
      warning: 'text-yellow-800 dark:text-yellow-200',
    }[type]

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'rounded-lg border px-4 py-3 flex items-center justify-between',
          bgColor,
          textColor,
          className
        )}
        {...props}
      >
        <span className="text-sm font-medium">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-lg font-semibold leading-none hover:opacity-70"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    )
  }
)
Toast.displayName = 'Toast'

export { Toast }
