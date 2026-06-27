import { tankRepository, tankRepositoryRuntime } from '../infrastructure/tankRepositories'
import {
  ActivateTankService,
  CreateTankService,
  DeactivateTankService,
  GetTankService,
  ListTankDipsService,
  ListTanksService,
  RecordTankDipService,
  UpdateTankService,
} from './services/TankServices'

export const listTanksService = new ListTanksService(tankRepository)
export const getTankService = new GetTankService(tankRepository)
export const createTankService = new CreateTankService(tankRepository)
export const updateTankService = new UpdateTankService(tankRepository)
export const activateTankService = new ActivateTankService(tankRepository)
export const deactivateTankService = new DeactivateTankService(tankRepository)
export const recordTankDipService = new RecordTankDipService(tankRepository)
export const listTankDipsService = new ListTankDipsService(tankRepository)

export const tankQueryKeys = {
  all: ['tanks'] as const,
  lists: () => [...tankQueryKeys.all, 'list'] as const,
  list: (activeOnly: boolean) => [...tankQueryKeys.lists(), { activeOnly }] as const,
  details: () => [...tankQueryKeys.all, 'detail'] as const,
  detail: (tankId: string) => [...tankQueryKeys.details(), tankId] as const,
  dips: (tankId: string) => [...tankQueryKeys.all, 'dips', tankId] as const,
}

export { tankRepositoryRuntime }
