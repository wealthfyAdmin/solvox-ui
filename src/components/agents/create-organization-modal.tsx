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
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setName("")
      setDesc("")
      setSubmitError(null)
      setSubmitting(false)
    }
  }, [open])

  const handleCreate = async () => {
    const orgName = name.trim()
    const orgDesc = desc.trim()
    if (!orgName) return

    try {
      setSubmitting(true)
      setSubmitError(null)

      const payload = {
        name: orgName,
        description: orgDesc || undefined,
        is_active: true,
        keys: {},
      }

      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || "Failed to create organization")
      }

      await onCreate(orgName, orgDesc || undefined)
      onClose()
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to create organization")
    } finally {
      setSubmitting(false)
    }
  }

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
        {submitError && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {submitError}
          </p>
        )}
      </div>
      <div className="mt-6 flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleCreate} disabled={!name.trim() || submitting} aria-busy={submitting}>
          {submitting ? "Creating..." : "Create"}
        </Button>
      </div>
    </Modal>
  )
}
