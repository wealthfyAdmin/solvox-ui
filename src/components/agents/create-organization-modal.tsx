"use client"

import { useEffect, useState } from "react"
import { Modal } from "@/components/ui/modal"
import Button from "../ui/button/Button"

export default function CreateOrganizationModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (name: string, description?: string) => void | Promise<void>
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
      <h3 className="mb-6 text-xl font-semibold text-foreground dark:text-white">Create organization</h3>
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground dark:text-white">Organization Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Acme Inc."
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground dark:text-white">
            Organization Description
          </label>
          <textarea
            rows={3}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full resize-y rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="What does your organization do?"
          />
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" disabled={!name.trim()} onClick={() => onCreate(name, desc)}>
          Create
        </Button>
      </div>
    </Modal>
  )
}
