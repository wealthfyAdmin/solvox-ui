"use client"

import { useEffect, useState } from "react"
import { Modal } from "@/components/ui/modal"
import Button from "../ui/button/Button"

export default function NewAgentModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (name: string, description?: string) => void
}) {
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")

  useEffect(() => {
    if (!open) {
      setName("")
      setDesc("")
    }
  }, [open])

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-lg p-8">
      <h3 className="mb-6 text-xl font-semibold text-foreground dark:text-white">Create new assistant</h3>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground dark:text-white">Assistant Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My New Assistant"
            autoFocus
            className=" dark:text-white w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground dark:text-white">Assistant Description</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            placeholder="Short description for your assistant"
            className=" dark:text-white w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" onClick={() => onCreate(name, desc)} disabled={!name.trim()}>
          Create Assistant
        </Button>
      </div>
    </Modal>
  )
}
