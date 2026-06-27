import { useMemo } from 'react'
import { useLocation, useMatches } from 'react-router-dom'
import { navigationSections } from '@app/router/navigation'
import type { BreadcrumbItem } from '@fuelms/ui'

type RouteHandle = {
  breadcrumb?: string
}

function findNavLabel(path: string): string | undefined {
  for (const section of navigationSections) {
    if (section.kind === 'link' && section.item.path === path) {
      return section.item.label
    }
    if (section.kind === 'group') {
      const match = section.items.find((item) => item.path === path)
      if (match) return match.label
    }
  }
  return undefined
}

export function useAppBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation()
  const matches = useMatches()

  return useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean)
    if (segments.length === 0) {
      return [{ label: 'Dashboard', href: '/dashboard' }]
    }

    const items: BreadcrumbItem[] = [{ label: 'Home', href: '/dashboard' }]

    segments.forEach((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join('/')}`
      const match = matches.find((item) => item.pathname === href)
      const handle = match?.handle as RouteHandle | undefined
      const label = handle?.breadcrumb ?? findNavLabel(segment) ?? segment.replace(/-/g, ' ')
      items.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        href: index < segments.length - 1 ? href : undefined,
      })
    })

    return items
  }, [location.pathname, matches])
}
