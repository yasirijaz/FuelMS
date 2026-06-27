export const POSTING_STATUSES = ['draft', 'posted', 'reversed', 'void'] as const
export type PostingStatus = (typeof POSTING_STATUSES)[number]

export const POSTING_STATUS_LABELS: Record<PostingStatus, string> = {
  draft: 'Draft',
  posted: 'Posted',
  reversed: 'Reversed',
  void: 'Void',
}

export function isPostingStatus(value: string): value is PostingStatus {
  return (POSTING_STATUSES as readonly string[]).includes(value)
}
