"use client"

import { Modal } from "@/components/ui/modal"
import Button from "../ui/button/Button";

export default function UnsavedChangesModal({
  isOpen,
  onCancel,
  onConfirm,
}: { isOpen: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} className="max-w-md p-6">
      <h3 className="mb-2 text-lg font-semibold text-foreground dark:text-white">Discard changes?</h3>
      <p className="mb-4 text-sm text-muted-foreground dark:text-gray-200">
        You have unsaved changes on this tab. If you continue, those changes will be lost.
      </p>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Stay
        </Button>
        <Button size="sm" onClick={onConfirm}>
          Discard
        </Button>
      </div>
    </Modal>
  )
}
