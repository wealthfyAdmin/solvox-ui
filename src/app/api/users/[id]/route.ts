import { type NextRequest, NextResponse } from "next/server"
import { getAuthHeaders } from "@/lib/auth"

const BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000"

// -------------------- PUT /api/users/[id] --------------------
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const headers = await getAuthHeaders()
    const body = await request.json()

    console.log("🔹 Updating user:", params.id, "Payload:", body)

    const response = await fetch(`${BACKEND_URL}/api/user/${params.id}`, {
      method: "PUT",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const text = await response.text()
    let data: any = null
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }

    if (!response.ok) {
      console.error("❌ Backend update failed:", response.status, data)
      return NextResponse.json(
        { error: data?.message || `Failed to update user (status ${response.status})` },
        { status: response.status }
      )
    }

    console.log("✅ User updated successfully:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("🔥 Error updating user:", error)
    return NextResponse.json({ error: "Internal server error while updating user" }, { status: 500 })
  }
}

// -------------------- DELETE /api/users/[id] --------------------
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const headers = await getAuthHeaders()

    console.log("🗑️ Deleting user:", params.id)

    const response = await fetch(`${BACKEND_URL}/api/user/${params.id}`, {
      method: "DELETE",
      headers,
    })

    const text = await response.text()
    let data: any = null
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }

    if (!response.ok) {
      console.error("❌ Backend delete failed:", response.status, data)
      return NextResponse.json(
        { error: data?.message || `Failed to delete user (status ${response.status})` },
        { status: response.status }
      )
    }

    console.log("✅ User deleted successfully:", data)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("🔥 Error deleting user:", error)
    return NextResponse.json({ error: "Internal server error while deleting user" }, { status: 500 })
  }
}
