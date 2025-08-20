"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, X } from "lucide-react"

type ToastType = "success" | "error"

interface ToastProps {
  message: string
  type?: ToastType
  onClose?: () => void
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.()
    }, 4000) // auto-close after 4 sec
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-5 right-5 w-[350px] rounded-lg bg-white shadow-md border border-gray-200 p-4 flex items-start gap-3"
    >
      {/* Icon */}
      {type === "success" ? (
        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
      ) : (
        <X className="w-5 h-5 text-red-500 mt-0.5" />
      )}

      {/* Content */}
      <div className="flex-1">
        <p className="text-sm text-gray-700">{message}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

export const useToast = () => {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type })
  }

  const ToastContainer = () => (
    <AnimatePresence>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AnimatePresence>
  )

  return { showToast, ToastContainer }
}
