import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { navigationSections } from '@app/router/navigation'
import { useTheme } from '@app/theme/ThemeProvider'
import { useCommandPalette, useRegisterCommands, type CommandItem } from '@fuelms/ui'

function flattenNavigationCommands(navigate: (path: string) => void): CommandItem[] {
  const commands: CommandItem[] = []

  for (const section of navigationSections) {
    if (section.kind === 'link') {
      commands.push({
        id: `nav-${section.item.path}`,
        label: `Go to ${section.item.label}`,
        group: 'Navigation',
        keywords: [section.item.label, section.item.path],
        onSelect: () => navigate(`/${section.item.path}`),
      })
    } else {
      for (const item of section.items) {
        commands.push({
          id: `nav-${item.path}`,
          label: `Go to ${item.label}`,
          group: section.label,
          keywords: [item.label, item.path, section.label],
          onSelect: () => navigate(`/${item.path}`),
        })
      }
    }
  }

  return commands
}

export function useNavigationCommands(): void {
  const navigate = useNavigate()
  const { setOpen } = useCommandPalette()
  const { toggleTheme, resolvedTheme } = useTheme()

  const commands = useMemo<CommandItem[]>(
    () => [
      ...flattenNavigationCommands((path) => navigate(path)),
      {
        id: 'ui-foundation',
        label: 'Open UI Foundation',
        group: 'Developer',
        keywords: ['design system', 'components'],
        onSelect: () => navigate('/_ui'),
      },
      {
        id: 'toggle-theme',
        label: `Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`,
        group: 'Preferences',
        shortcut: 'T',
        keywords: ['theme', 'dark', 'light'],
        onSelect: toggleTheme,
      },
      {
        id: 'open-command-palette',
        label: 'Open command palette',
        group: 'Preferences',
        shortcut: 'Ctrl+K',
        onSelect: () => setOpen(true),
      },
    ],
    [navigate, resolvedTheme, setOpen, toggleTheme],
  )

  useRegisterCommands(commands)
}
