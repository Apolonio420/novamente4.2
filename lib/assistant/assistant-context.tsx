'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface BugReportData {
  errorMessage?: string
  errorStack?: string
  errorDigest?: string
  sourceUrl?: string
  screenshotUrl?: string
}

interface AssistantContextValue {
  /** Open the assistant with a pre-filled bug report */
  openWithBugReport: (data: BugReportData) => void
  /** Current bug report data (consumed by the widget) */
  bugReport: BugReportData | null
  /** Clear the bug report after it's been consumed */
  clearBugReport: () => void
  /** Whether the assistant should open */
  shouldOpen: boolean
  /** Reset the open trigger */
  resetOpen: () => void
}

const AssistantContext = createContext<AssistantContextValue | null>(null)

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [bugReport, setBugReport] = useState<BugReportData | null>(null)
  const [shouldOpen, setShouldOpen] = useState(false)

  const openWithBugReport = useCallback((data: BugReportData) => {
    setBugReport(data)
    setShouldOpen(true)
  }, [])

  const clearBugReport = useCallback(() => {
    setBugReport(null)
  }, [])

  const resetOpen = useCallback(() => {
    setShouldOpen(false)
  }, [])

  return (
    <AssistantContext.Provider
      value={{ openWithBugReport, bugReport, clearBugReport, shouldOpen, resetOpen }}
    >
      {children}
    </AssistantContext.Provider>
  )
}

export function useAssistant() {
  const ctx = useContext(AssistantContext)
  if (!ctx) {
    // Return a no-op version when outside provider (non-workspace pages)
    return {
      openWithBugReport: () => {},
      bugReport: null,
      clearBugReport: () => {},
      shouldOpen: false,
      resetOpen: () => {},
    }
  }
  return ctx
}
