import {
  createContext,
  useCallback,
  useContext,
  useState,
  type PropsWithChildren,
} from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

export type ConfirmOptions = {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger'
}

type ConfirmContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

type PendingConfirm = ConfirmOptions & {
  resolve: (value: boolean) => void
}

export function ConfirmProvider({ children }: PropsWithChildren) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve })
    })
  }, [])

  const close = (value: boolean) => {
    pending?.resolve(value)
    setPending(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal
        open={pending != null}
        onClose={() => close(false)}
        title={pending?.title ?? ''}
        description={pending?.description}
        size="sm"
        footer={
          pending && (
            <>
              <Button variant="secondary" onClick={() => close(false)}>
                {pending.cancelLabel ?? 'Cancel'}
              </Button>
              <Button
                variant={pending.variant === 'danger' ? 'danger' : 'primary'}
                onClick={() => close(true)}
              >
                {pending.confirmLabel ?? 'Confirm'}
              </Button>
            </>
          )
        }
      >
        <span className="sr-only">{pending?.description}</span>
      </Modal>
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmContextValue['confirm'] {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx.confirm
}
