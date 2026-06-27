import type { ITransactionContext } from './ITransactionContext'

/**
 * IUnitOfWork â€” coordinates multiple repository operations in a single transaction.
 *
 * The Unit of Work pattern tracks objects read from or written to a data store and
 * coordinates writing out changes as a single unit. It satisfies the requirement from
 * the IMPLEMENTATION_GUIDE: "Performing mutating work inside defined transaction
 * boundaries (Unit of Work / transaction manager pattern)."
 *
 * The EDA Architecture requires: "Financial + inventory + events must be atomic
 * where required." This interface is the mechanism.
 *
 * Two modes:
 *
 * 1. begin() / commit() / rollback() â€” explicit control
 *    Use when the application service needs fine-grained control, or when
 *    passing the same transaction to multiple repositories explicitly.
 *
 * 2. execute(fn) â€” scope-managed transaction
 *    Preferred for most use cases. Automatically commits on success,
 *    rolls back on any thrown error, and re-throws the error.
 *    Guarantees atomicity without manual try/catch/rollback.
 *
 * Usage of execute():
 *
 *   const result = await unitOfWork.execute(async (tx) => {
 *     await fuelBatchRepo.save(batch, tx)
 *     await journalRepo.save(journal, tx)
 *     return batch.id
 *   })
 */

export interface IUnitOfWork {
  /** Begin a new transaction. Returns the active context. */
  begin(): Promise<ITransactionContext>

  /**
   * Execute a unit of work in a managed transaction.
   * Commits on success, rolls back on error, re-throws the error.
   */
  execute<T>(work: (tx: ITransactionContext) => Promise<T>): Promise<T>
}
