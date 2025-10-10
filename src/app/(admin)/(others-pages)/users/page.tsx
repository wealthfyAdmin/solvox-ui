"use client"

import type React from "react"
import LoadingSpinner from "@/components/ui/loadingspinner/loadingspinner"
import PageBreadcrumb from "@/components/common/PageBreadCrumb"
import { Modal } from "@/components/ui/modal"
import Pagination from "@/components/tables/Pagination"
import MultiSelect from "@/components/form/MultiSelect"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import Badge from "@/components/ui/badge/Badge"
import Button from "@/components/ui/button/Button"
import Input from "@/components/form/input/InputField"
import Label from "@/components/form/Label"
import { useState, useEffect } from "react"
import { MoreVertical, Plus, Edit, Trash2 } from "lucide-react"

interface User {
  id: number
  email: string
  name: string
  role: string
  organization_id: number
  department_ids: number[] // Changed from department_id to department_ids array
  department_names?: string[]
}

interface Department {
  id: number
  name: string
}

interface CreateUserData {
  email: string
  name: string
  role: string
  organization_id: number
  department_ids: number[] // Changed from department_id to department_ids array
  password: string
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    department_ids: [] as number[], // Changed from department_id to department_ids array
    role: "user",
    organization_id: 1,
  })

  const itemsPerPage = 10

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
        setTotalPages(Math.ceil(data.length / itemsPerPage))
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments")
      if (response.ok) {
        const data = await response.json()
        setDepartments(data)
      }
    } catch (error) {
      console.error("Error fetching departments:", error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchDepartments()
  }, [])

  // Get paginated users
  const paginatedUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const getDepartmentNames = (departmentIds: number[]) => {
    return departmentIds.map((id) => {
      const dept = departments.find((d) => d.id === id)
      return dept?.name || "Unknown"
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "organization_id" ? Number.parseInt(value) : value,
    }))
  }

  const handleDepartmentChange = (selectedIds: number[]) => {
    setFormData((prev) => ({
      ...prev,
      department_ids: selectedIds,
    }))
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!")
      return
    }

    if (formData.department_ids.length === 0) {
      alert("Please select at least one department!")
      return
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          role: formData.role,
          organization_id: formData.organization_id,
          department_ids: formData.department_ids, // Changed from department_id to department_ids
          password: formData.password,
        }),
      })

      if (response.ok) {
        setIsCreateModalOpen(false)
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          department_ids: [], // Reset to empty array
          role: "user",
          organization_id: 1,
        })
        fetchUsers()
      }
    } catch (error) {
      console.error("Error creating user:", error)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    if (formData.department_ids.length === 0) {
      alert("Please select at least one department!")
      return
    }

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          role: formData.role,
          organization_id: formData.organization_id,
          department_ids: formData.department_ids, // Changed from department_id to department_ids
          password: formData.password,
        }),
      })

      if (response.ok) {
        setIsEditModalOpen(false)
        setSelectedUser(null)
        fetchUsers()
      }
    } catch (error) {
      console.error("Error updating user:", error)
    }
  }

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setIsDeleteModalOpen(false)
        setSelectedUser(null)
        fetchUsers()
      }
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      confirmPassword: "",
      department_ids: user.department_ids, // Changed from department_id to department_ids
      role: user.role,
      organization_id: user.organization_id,
    })
    setIsEditModalOpen(true)
    setActiveDropdown(null)
  }

  // Open delete modal
  const openDeleteModal = (user: User) => {
    setSelectedUser(user)
    setIsDeleteModalOpen(true)
    setActiveDropdown(null)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Users" />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Header with Create Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Users Management</h2>
          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create User
          </Button>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] mb-6">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Email
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Departments
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {paginatedUsers.map((user) => {
                  const departmentNames = getDepartmentNames(user.department_ids)
                  const visibleDepartments = departmentNames.slice(0, 2)
                  const hasMore = departmentNames.length > 2

                  return (
                    <TableRow key={user.id}>
                      <TableCell className="px-5 py-4 text-start">
                        <span className="font-medium text-gray-800 dark:text-white/90">{user.name}</span>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">{user.email}</TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          {visibleDepartments.map((deptName, index) => (
                            <Badge key={index} size="sm" color="primary">
                              {deptName}
                            </Badge>
                          ))}
                          {hasMore && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                              +{departmentNames.length - 2} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {activeDropdown === user.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                              <button
                                onClick={() => openEditModal(user)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => openDeleteModal(user)}
                                className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>

        {/* Create User Modal */}
        <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} className="max-w-2xl">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Create New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input name="name" defaultValue={formData.name} onChange={handleInputChange} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input name="email" type="email" defaultValue={formData.email} onChange={handleInputChange} required />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  name="password"
                  type="password"
                  defaultValue={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input
                  name="confirmPassword"
                  type="password"
                  defaultValue={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <Label>Departments</Label>
                <MultiSelect
                  options={departments}
                  selectedIds={formData.department_ids}
                  onChange={handleDepartmentChange}
                  placeholder="Select departments..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button>Create User</Button>
                <Button onClick={() => setIsCreateModalOpen(false)} variant="secondary">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Edit User Modal */}
        <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} className="max-w-2xl">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Edit User</h3>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input name="name" defaultValue={formData.name} onChange={handleInputChange} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input name="email" type="email" defaultValue={formData.email} onChange={handleInputChange} required />
              </div>
              <div>
                <Label>Password (leave blank to keep current)</Label>
                <Input name="password" type="password" defaultValue={formData.password} onChange={handleInputChange} />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input
                  name="confirmPassword"
                  type="password"
                  defaultValue={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label>Departments</Label>
                <MultiSelect
                  options={departments}
                  selectedIds={formData.department_ids}
                  onChange={handleDepartmentChange}
                  placeholder="Select departments..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button>Update User</Button>
                <Button onClick={() => setIsEditModalOpen(false)} variant="secondary">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} className="max-w-xl">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Delete User</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
                Delete
              </Button>
              <Button onClick={() => setIsDeleteModalOpen(false)} variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
