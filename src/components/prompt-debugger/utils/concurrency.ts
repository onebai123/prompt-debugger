/**
 * 并发控制工具
 */

/** 并发执行任务 */
export async function executeConcurrently<T, R>(
  items: T[],
  executor: (item: T) => Promise<R>,
  concurrency: number,
  onProgress?: (completed: number, total: number) => void
): Promise<R[]> {
  const results: R[] = []
  let completed = 0
  const total = items.length

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        const result = await executor(item)
        completed++
        onProgress?.(completed, total)
        return result
      })
    )
    results.push(...batchResults)
  }

  return results
}

/** 批量执行并收集结果 */
export async function executeBatchWithResults<T, R>(
  items: T[],
  executor: (item: T) => Promise<R>,
  concurrency: number,
  onProgress?: (completed: number, total: number) => void
): Promise<Map<number, R>> {
  const results = new Map<number, R>()
  let completed = 0
  const total = items.length

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.all(
      batch.map(async (item, index) => {
        try {
          const result = await executor(item)
          completed++
          onProgress?.(completed, total)
          return { index: i + index, result }
        } catch (error) {
          completed++
          onProgress?.(completed, total)
          return { index: i + index, result: null as R }
        }
      })
    )

    batchResults.forEach(({ index, result }) => {
      if (result !== null) {
        results.set(index, result)
      }
    })
  }

  return results
}
