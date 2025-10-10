"use client"

import { Modal } from "@/components/ui/modal"
import Button from "../ui/button/Button"

export default function DeleteOrganizationModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean
  onCancel: () => void
  onConfirm: () => void | Promise<void>
}) {
  return (
    <Modal isOpen={open} onClose={onCancel} className="max-w-md p-8">
      <h3 className="mb-3 text-xl font-semibold text-foreground dark:text-white">Delete Organization?</h3>
      <p className="mb-6 text-sm text-muted-foreground dark:text-white">
        This will remove the organization and any assistants under it.
      </p>
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </Modal>
  )
}
