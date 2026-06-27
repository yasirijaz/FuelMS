import type { ComponentType } from 'react'

export type AppRoute = {
  path: string
  label: string
  description: string
  Component: ComponentType
}

export type NavItem = {
  path: string
  label: string
}

export type NavSection =
  | { kind: 'link'; item: NavItem }
  | { kind: 'group'; label: string; items: NavItem[] }
