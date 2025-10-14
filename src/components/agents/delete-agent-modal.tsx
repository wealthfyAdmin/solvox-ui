"use client"

import { Modal } from "@/components/ui/modal"
import Button from "../ui/button/Button"

export default function DeleteAgentModal({
  isOpen,
  onCancel,
  onConfirm,
  agentName,
}: {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
  agentName: string
}) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} className="max-w-md p-8">
      <h3 className="mb-3 text-xl font-semibold text-foreground dark:text-white">Delete Assistant?</h3>
      <p className="mb-6 text-sm text-muted-foreground dark:text-white">
        Are you sure you want to delete <strong>{agentName}</strong>? This action cannot be undone.
      </p>
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white">
          Delete
        </Button>
      </div>
    </Modal>
  )
}
