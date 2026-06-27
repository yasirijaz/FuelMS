import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../lib/cn'
import { trapFocus } from '../lib/focusTrap'
import { Button } from './Button'

type ModalContextValue = {
  openModal: (options: OpenModalOptions) => string
  closeModal: (id: string) => void
}

type OpenModalOptions = {
  title: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  footer?: ReactNode
}

type ActiveModal = OpenModalOptions & { id: string }

const ModalContext = createContext<ModalContextValue | null>(null)

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

function ModalLayer({ modal, onClose }: { modal: ActiveModal; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const release = trapFocus(panel)
    panel.focus()
    return release
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[var(--ui-z-modal)] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${modal.id}-title`}
        aria-describedby={modal.description ? `${modal.id}-description` : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full rounded-[var(--ui-radius-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] shadow-[var(--ui-shadow-lg)] outline-none',
          sizeClasses[modal.size ?? 'md'],
        )}
      >
        <div className="border-b border-[var(--ui-border)] px-5 py-4">
          <h2 id={`${modal.id}-title`} className="text-base font-semibold text-[var(--ui-text)]">
            {modal.title}
          </h2>
          {modal.description && (
            <p id={`${modal.id}-description`} className="mt-1 text-sm text-[var(--ui-text-muted)]">
              {modal.description}
            </p>
          )}
        </div>
        <div className="px-5 py-4">{modal.children}</div>
        {modal.footer && (
          <div className="flex justify-end gap-2 border-t border-[var(--ui-border)] px-5 py-4">
            {modal.footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export function ModalProvider({ children }: PropsWithChildren) {
  const [modals, setModals] = useState<ActiveModal[]>([])

  const closeModal = useCallback((id: string) => {
    setModals((current) => current.filter((modal) => modal.id !== id))
  }, [])

  const openModal = useCallback((options: OpenModalOptions) => {
    const id = crypto.randomUUID()
    setModals((current) => [...current, { ...options, id }])
    return id
  }, [])

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {modals.map((modal) => (
        <ModalLayer key={modal.id} modal={modal} onClose={() => closeModal(modal.id)} />
      ))}
    </ModalContext.Provider>
  )
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}

export type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

/** Declarative modal for simple controlled use cases. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const id = useId()
  if (!open) return null

  return (
    <ModalLayer
      modal={{ id, title, description, children, footer, size }}
      onClose={onClose}
    />
  )
}

export function ModalCloseButton({ onClick, label = 'Close' }: { onClick: () => void; label?: string }) {
  return (
    <Button variant="secondary" onClick={onClick}>
      {label}
    </Button>
  )
}
