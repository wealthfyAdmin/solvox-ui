"use client"

import { X } from "lucide-react"
import { useRef, useEffect } from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  isFullscreen?: boolean
}

export function Modal({
  isOpen,
  onClose,
  children,
  className = "",
  isFullscreen = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Close modal on Escape key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("keydown", handleEsc)
    }
  }, [onClose])

  if (!isOpen) return null

  // Overlay classes
  const overlayClasses =
    "fixed inset-0 h-full w-full bg-gray-400/50 dark:bg-gray-900/60 backdrop-blur-[32px] transition-colors duration-300"

  // Content classes
  const contentClasses = isFullscreen
    ? "w-full h-full"
    : "relative w-full rounded-3xl bg-white dark:bg-gray-900 shadow-xl transition-colors duration-300"

  return (
    <div
      className={`fixed inset-0 z-[99999] ${
        isFullscreen
          ? "overflow-hidden"
          : "flex items-center justify-center overflow-y-auto"
      }`}
    >
      {/* Overlay */}
      <div className={overlayClasses} onClick={onClose} />

      {/* Modal Content */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className={`${contentClasses} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {!isFullscreen && (
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white p-2 text-gray-800 shadow-md transition-colors duration-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Children */}
        {children}
      </div>
    </div>
  )
}
