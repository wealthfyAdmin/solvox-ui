"use client"

import { useState } from "react"
import { Eye, Trash2, MoreVertical } from "lucide-react"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import Pagination from "../tables/Pagination"
import Badge from "../ui/badge/Badge"
// import { Badge } from "../ui/badge/Badge"
interface FileItem {
  id: string
  name: string
  category: string
  size: string
  dateModified: string
}

const SAMPLE_FILES: FileItem[] = [
  {
    id: "1",
    name: "Video_947954.pdf",
    category: "Document",
    size: "89 MB",
    dateModified: "12 Jan, 2027",
  },
  {
    id: "2",
    name: "Travel.pdf",
    category: "Document",
    size: "5.4 MB",
    dateModified: "10 Feb, 2027",
  },
  {
    id: "3",
    name: "Document.pdf",
    category: "Document",
    size: "1.2 MB",
    dateModified: "8 Mar, 2027",
  },
  {
    id: "4",
    name: "Video_947954_028.pdf",
    category: "Document",
    size: "489 MB",
    dateModified: "29 Apr, 2027",
  },
  {
    id: "5",
    name: "Mountain.pdf",
    category: "Document",
    size: "5.4 MB",
    dateModified: "10 Feb, 2027",
  },
  {
    id: "6",
    name: "CV.pdf",
    category: "Document",
    size: "12 MB",
    dateModified: "17 Jun, 2027",
  },
  {
    id: "7",
    name: "Video_09783_88294.pdf",
    category: "Document",
    size: "309 MB",
    dateModified: "27 Jul, 2027",
  },
]

const ITEMS_PER_PAGE = 5

export default function RecentFilesTable() {
  const [files, setFiles] = useState<FileItem[]>(SAMPLE_FILES)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    setFiles(files.filter((file) => file.id !== id))
    setActiveDropdown(null)
  }

  const totalPages = Math.ceil(files.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedFiles = files.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const getFileIcon = (category: string) => {
    const iconClass = "w-5 h-5"
    switch (category) {
      case "Video":
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        )
      case "Image":
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
        )
      default:
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-8-6z" />
          </svg>
        )
    }
  }

  const getBadgeColor = (category: string) => {
    switch (category) {
      case "Video":
        return "primary"
      case "Image":
        return "primary"
      default:
        return "primary"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with title and view all link */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Recent Files</h2>
      </div>

      {/* Table with proper styling matching users component */}
      <div className="overflow-hidden rounded-xl  border-gray-200 bg-white  dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-gray-200">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                >
                  File Name
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                >
                  Category
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                >
                  Size
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                >
                  Date Modified
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-200">
              {paginatedFiles.length > 0 ? (
                paginatedFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="px-5 py-4 text-start">
                      <div className="flex items-center gap-3">
                        <div className="text-gray-600 dark:text-gray-400">{getFileIcon(file.category)}</div>
                        <span className="font-medium text-gray-500 dark:text-white/90">{file.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge size="sm" color={getBadgeColor(file.category)}>
                        {file.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400">{file.size}</TableCell>
                    <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400">{file.dateModified}</TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === file.id ? null : file.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        {activeDropdown === file.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-300 z-50">
                            <button
                              onClick={() => setActiveDropdown(null)}
                              className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>
                            <button
                              onClick={() => handleDelete(file.id)}
                              className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="px-5 py-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No files uploaded yet.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {files.length > 0 && (
        <div className="flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      )}
    </div>
  )
}
