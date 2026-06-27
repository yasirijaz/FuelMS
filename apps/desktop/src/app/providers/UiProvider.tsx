import { type PropsWithChildren } from 'react'
import {
  CommandPaletteProvider,
  ConfirmProvider,
  ModalProvider,
  ToastProvider,
} from '@fuelms/ui'

export function UiProvider({ children }: PropsWithChildren) {
  return (
    <ToastProvider>
      <ModalProvider>
        <ConfirmProvider>
          <CommandPaletteProvider>{children}</CommandPaletteProvider>
        </ConfirmProvider>
      </ModalProvider>
    </ToastProvider>
  )
}
