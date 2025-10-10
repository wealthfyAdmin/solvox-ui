"use client"

import { Modal } from "@/components/ui/modal"
import Button from "../ui/button/Button";
import { useState } from "react"

export default function WebCallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [connected, setConnected] = useState(false)
  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Web Call</h3>
      <p className="mt-1 text-sm text-muted-foreground dark:text-gray-300">
        Talk with your assistant from the browser. This is a sample modal stub.
      </p>

      <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-200">
            Status:{" "}
            <span className={connected ? "text-emerald-600" : "text-amber-600"}>
              {connected ? "Connected" : "Idle"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!connected ? (
              <Button size="sm" onClick={() => setConnected(true)}>
                Connect
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setConnected(false)}>
                Disconnect
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button size="sm" variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  )
}
