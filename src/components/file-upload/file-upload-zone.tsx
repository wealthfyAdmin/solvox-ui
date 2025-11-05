"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload } from "lucide-react"

interface FileItem {
  id: string
  name: string
  size: number
  category: string
  dateModified: string
}

export default function FileUploadZone() {
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFiles, setUploadedFiles] = useState<FileItem[]>([])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(e.type === "dragenter" || e.type === "dragover")
  }

  const getFileCategory = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase() || ""
    if (["mp4", "avi", "mov", "mkv"].includes(ext)) return "Video"
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "Image"
    if (["pdf", "doc", "docx", "txt", "xlsx"].includes(ext)) return "Document"
    return "File"
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const handleFiles = (files: FileList) => {
    const newFiles: FileItem[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      category: getFileCategory(file.name),
      dateModified: new Date().toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    }))

    setUploadedFiles((prev) => [...prev, ...newFiles])
  }

  const handleDrop = (e: React.DragEvent) => {
    handleDrag(e)
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  return (
    <div className="space-y-6">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed border-brand-500 rounded-xl p-8 transition-all text-center ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.02]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleInputChange}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.xlsx"
        />

        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700">
            <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>

          <h3 className="text-lg font-semibold dark:text-white/90 text-foreground">Drag & Drop Files Here</h3>

          <p className="text-sm text-gray-400 text-muted-foreground">Drag and drop your PNG, JPG, WebP, SVG images here or browse</p>

          <button
            onClick={handleBrowseClick}
            className="text-primary dark:text-white/90 hover:text-primary/80 underline font-medium text-sm"
          >
            Browse File
          </button>
        </div>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            ✓ {uploadedFiles.length} file(s) ready to upload
          </p>
        </div>
      )}
    </div>
  )
}
