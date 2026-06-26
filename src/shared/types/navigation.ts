import type { ComponentType } from 'react'

export type AppRoute = {
  path: string
  label: string
  description: string
  Component: ComponentType
}
