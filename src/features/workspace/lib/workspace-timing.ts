type WorkspaceTimingStatus = "ok" | "error" | "cancelled"

const isWorkspaceTimingEnabled = process.env.NODE_ENV === "development"
const WORKSPACE_TIMING_PREFIX = "visibl.workspace"

let timingId = 0

function getPerformance(): Performance | null {
  if (!isWorkspaceTimingEnabled || typeof performance === "undefined") {
    return null
  }

  return performance
}

function formatTimingLabel(name: string, detail?: string): string {
  return detail ? `${name} (${detail})` : name
}

export function startWorkspaceTiming(
  name: string,
  detail?: string
): {
  end: (status?: WorkspaceTimingStatus) => void
} {
  const perf = getPerformance()

  if (!perf) {
    return { end: () => undefined }
  }

  const id = `${WORKSPACE_TIMING_PREFIX}:${name}:${++timingId}`
  const startMark = `${id}:start`
  const endMark = `${id}:end`
  const label = `${WORKSPACE_TIMING_PREFIX}:${formatTimingLabel(name, detail)}`
  const start = perf.now()

  perf.mark(startMark)

  return {
    end(status: WorkspaceTimingStatus = "ok") {
      const durationMs = perf.now() - start

      try {
        perf.mark(endMark)
        perf.measure(label, startMark, endMark)
        perf.clearMarks(startMark)
        perf.clearMarks(endMark)
      } catch {
        // Measurement should never affect workspace behavior.
      }

      console.debug(
        `[workspace timing] ${formatTimingLabel(name, detail)} ${durationMs.toFixed(1)}ms ${status}`
      )
    },
  }
}

export async function measureWorkspaceTiming<T>(
  name: string,
  action: () => Promise<T>,
  detail?: string
): Promise<T> {
  const timing = startWorkspaceTiming(name, detail)

  try {
    const result = await action()
    timing.end()
    return result
  } catch (error) {
    timing.end("error")
    throw error
  }
}
