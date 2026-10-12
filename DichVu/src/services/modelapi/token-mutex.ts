/**
 * In-process FIFO mutex keyed by tokenId.
 * Ensures serial execution of quota topups per token,
 * preventing lost updates and race conditions on upstream ModelAPI.
 */

class TokenMutexManager {
  private queues = new Map<number, Promise<void>>();

  /**
   * Acquires an exclusive lock for the specified tokenId.
   * Resolves with a release callback once the lock is obtained.
   *
   * @param tokenId Upstream ModelAPI token ID
   * @param timeoutMs Maximum milliseconds to wait for the lock (default: 30000ms)
   * @returns Function to invoke to release the lock
   */
  async acquire(tokenId: number, timeoutMs: number = 30000): Promise<() => void> {
    let releaseFn!: () => void;
    let timeoutId: NodeJS.Timeout | undefined;

    const previousLock = this.queues.get(tokenId) ?? Promise.resolve();

    let acquiredResolve!: () => void;
    const lockAcquired = new Promise<void>((resolve) => {
      acquiredResolve = resolve;
    });

    const lockReleased = new Promise<void>((resolve) => {
      releaseFn = () => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve();
      };
    });

    // Queue behind the previous lock holder
    const currentLock = previousLock
      .then(() => {
        acquiredResolve();
        return lockReleased;
      })
      .catch(() => {
        // Even if prior operation failed, grant lock to the next waiter
        acquiredResolve();
        return lockReleased;
      })
      .finally(() => {
        // Free memory when the queue for this tokenId has completely drained
        if (this.queues.get(tokenId) === currentLock) {
          this.queues.delete(tokenId);
        }
      });

    this.queues.set(tokenId, currentLock);

    if (timeoutMs > 0) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Timeout of ${timeoutMs}ms waiting to acquire token lock for token ${tokenId}`));
        }, timeoutMs);
      });

      try {
        await Promise.race([lockAcquired, timeoutPromise]);
      } catch (err) {
        // Drain this node so downstream waiters are not permanently blocked
        releaseFn();
        throw err;
      }
    } else {
      await lockAcquired;
    }

    let isReleased = false;
    return () => {
      if (!isReleased) {
        isReleased = true;
        releaseFn();
      }
    };
  }
}

export const tokenMutex = new TokenMutexManager();

export const acquireTokenLock = (tokenId: number, timeoutMs?: number) =>
  tokenMutex.acquire(tokenId, timeoutMs);
