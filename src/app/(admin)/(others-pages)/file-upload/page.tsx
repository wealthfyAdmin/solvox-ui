import PageBreadcrumb from "@/components/common/PageBreadCrumb"
import type { Metadata } from "next"
import FileUploadZone from "@/components/file-upload/file-upload-zone"
import RecentFilesTable from "@/components/file-upload/recent-files-table"

export const metadata: Metadata = {
  title: "Solxox AI | File Upload",
  description: "Manage Knowledge Base File Uploads",
}

export default function FileUpload() {
  return (
    <div>
      <PageBreadcrumb pageTitle="File Upload" />

      <div className="min-h-screen space-y-8">
        {/* Upload Zone Section */}
        <div className="rounded-2xl  border-gray-200 bg-gradient-to-br from-white to-gray-50 dark:from-white/[0.03] dark:to-white/[0.02] rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] transition px-5 py-7 xl:px-10 xl:py-12">
          <FileUploadZone />
        </div>

        {/* Recent Files Section */}
        <div className="rounded-2xl  border-gray-200 bg-gradient-to-br from-white to-gray-50 dark:from-white/[0.03] rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] dark:to-white/[0.02] transition px-5 py-7 xl:px-10 xl:py-12">
          <RecentFilesTable />
        </div>
      </div>
    </div>
  )
}
