"use client"

import { useEffect, useState } from "react"
import { Modal } from "@/components/ui/modal"
import Button from "../ui/button/Button"

const BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"

export default function NewAgentModal({
  open,
  onClose,
  onCreate,
  organizationId,
}: {
  open: boolean
  onClose: () => void
  onCreate: (name: string, description?: string) => void
  organizationId?: string | number
}) {
  const [name, setName] = useState("")
  const [desc, setDesc] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setName("")
      setDesc("")
      setSubmitting(false)
      setErr(null)
    }
  }, [open])

  const generateUniqueName = (orgId: string | number, display_name: string): string => {
    const timestamp = Date.now()
    const sanitized = display_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
    return `${orgId}-${sanitized}-${timestamp}`
  }

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-lg p-8">
      <h3 className="mb-6 text-xl font-semibold text-foreground dark:text-white">Create new assistant</h3>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground dark:text-white">
            Assistant Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My New Assistant"
            autoFocus
            className=" dark:text-white w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          {err && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{err}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground dark:text-white">
            Assistant Description
          </label>
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
        <Button
          size="sm"
          onClick={async () => {
            if (!name.trim()) return
            try {
              setSubmitting(true)
              setErr(null)

              const rawOrgId = organizationId
              const invalidOrgId = rawOrgId == null || (typeof rawOrgId === "string" && rawOrgId.trim().length === 0)
              if (invalidOrgId) {
                setErr("Select an organization before creating an assistant")
                setSubmitting(false)
                return
              }
              const orgIdStr = typeof rawOrgId === "string" ? rawOrgId.trim() : String(rawOrgId)
              const orgIdNum = Number(orgIdStr)

              const uniqueName = generateUniqueName(orgIdNum, name.trim())

              const res = await fetch(`/api/agents`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: uniqueName,
                  display_name: name.trim(),
                  description: desc.trim() || undefined,
                  organization_id: isNaN(orgIdNum) ? orgIdStr : orgIdNum,
                }),
              })

              const data = await res.json().catch(() => ({}))
              if (!res.ok) throw new Error(data?.message || data?.error || "Failed to create agent")

              onCreate(name.trim(), desc.trim() || undefined)
              onClose()
            } catch (e: any) {
              setErr(e?.message ?? "Failed to create agent")
            } finally {
              setSubmitting(false)
            }
          }}
          disabled={
            !name.trim() ||
            submitting ||
            organizationId == null ||
            (typeof organizationId === "string" && organizationId.trim().length === 0)
          }
        >
          {submitting ? "Creating..." : "Create Assistant"}
        </Button>
      </div>
    </Modal>
  )
}
