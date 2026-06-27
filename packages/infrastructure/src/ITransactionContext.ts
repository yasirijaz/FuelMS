/**
 * ITransactionContext — represents an active database transaction scope.
 *
 * Why this exists:
 * The ENGINEERING_STANDARDS state: "Repositories receive a transaction or executor
 * handle. They never open their own connection. A repository must never commit or
 * roll back a transaction it did not start."
 *
 * A transaction context is the pass-through token that coordinates multiple
 * repository operations in a single atomic unit. The concrete implementation
 * (SqliteTransactionContext) wraps a real SQLite transaction. In tests,
 * InMemoryTransactionContext is a no-op.
 *
 * The domain and application layers depend on this interface, not the implementation.
 * The Tauri backend provides the concrete SQLite-backed implementation.
 *
 * Usage pattern:
 *
 *   const tx = await unitOfWork.begin()
 *   try {
 *     await fuelBatchRepo.save(batch, tx)
 *     await journalRepo.save(journal, tx)
 *     await tx.commit()
 *   } catch (e) {
 *     await tx.rollback()
 *     throw e
 *   }
 */

export interface ITransactionContext {
  /** Commit all operations performed within this context. */
  commit(): Promise<void>

  /** Roll back all operations performed within this context. */
  rollback(): Promise<void>

  /** True if the transaction has been started but not yet committed or rolled back. */
  readonly isActive: boolean
}
