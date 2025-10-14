"use client"

import React, { useState } from "react"
import { cn } from "@/lib/utils" // if you don’t have this, I’ll show fallback below

// ---- Dialog Root ----
function Dialog({
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  return React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child
    return React.cloneElement(child, { open, setOpen })
  })
}

// ---- Dialog Trigger ----
function DialogTrigger({ children, setOpen }: { children: React.ReactNode; setOpen: (v: boolean) => void }) {
  return (
    <button onClick={() => setOpen(true)} data-slot="dialog-trigger">
      {children}
    </button>
  )
}

// ---- Dialog Overlay ----
function DialogOverlay({ open }: { open: boolean }) {
  if (!open) return null
  return <div data-slot="dialog-overlay" className="fixed inset-0 bg-black/50 z-40 animate-fadeIn" />
}

// ---- Dialog Content ----
function DialogContent({
  open,
  setOpen,
  className,
  children,
  showCloseButton = true,
}: {
  open: boolean
  setOpen: (v: boolean) => void
  className?: string
  children: React.ReactNode
  showCloseButton?: boolean
}) {
  if (!open) return null
  return (
    <div
      data-slot="dialog-content"
      className={cn(
        "fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-6 shadow-lg",
        "animate-fadeIn",
        className,
      )}
    >
      {children}
      {showCloseButton && (
        <button
          data-slot="dialog-close"
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          <span className="sr-only">Close</span>
        </button>
      )}
    </div>
  )
}

// ---- Dialog Header / Footer / Title / Description ----
function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      data-slot="dialog-title"
      className={cn("text-lg font-semibold leading-none text-gray-900 dark:text-gray-100", className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      data-slot="dialog-description"
      className={cn("text-sm text-gray-500 dark:text-gray-300", className)}
      {...props}
    />
  )
}

// ---- Export all ----
export {
  Dialog,
  DialogTrigger,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
