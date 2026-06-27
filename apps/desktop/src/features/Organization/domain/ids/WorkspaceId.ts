import { UniqueId } from '@fuelms/core'

export const DEFAULT_WORKSPACE_ID = 'workspace-default'

export class WorkspaceId extends UniqueId {
  static default(): WorkspaceId {
    return new WorkspaceId(DEFAULT_WORKSPACE_ID)
  }

  static fromPersisted(value: string): WorkspaceId {
    return new WorkspaceId(value)
  }
}
