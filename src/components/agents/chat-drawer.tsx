"use client"

import { useEffect } from "react"
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog/Dialog"

export default function ChatDrawer({
  open,
  onClose,
  agentName,
}: {
  open: boolean
  onClose: () => void
  agentName: string
}) {
  // lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <DialogOverlay open={open} />
      <DialogContent className="p-0 border-0 bg-transparent">
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-gray-900 shadow-xl border-l border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Chat with {agentName}</h3>
            <button
              className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              onClick={onClose}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>
          <div className="flex h-[calc(100vh-56px)] flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Placeholder chat messages */}
              <div className="text-xs text-muted-foreground dark:text-gray-300">
                Start chatting with your assistant…
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                }}
                className="flex items-center gap-2"
              >
                <input
                  className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type a message…"
                />
                <button type="submit" className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700">
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
