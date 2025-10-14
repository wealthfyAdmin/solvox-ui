import { type NextRequest, NextResponse } from "next/server"
import { getAuthHeaders } from "@/lib/auth"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const headers = await getAuthHeaders()
    const body = await request.json()

    const response = await fetch(`http://34.14.223.154/api/user/${params.id}`, {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error("Failed to update user")
    }

    const user = await response.json()
    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const headers = await getAuthHeaders()

    const response = await fetch(`http://34.14.223.154/api/user/${params.id}`, {
      method: "DELETE",
      headers,
    })

    if (!response.ok) {
      throw new Error("Failed to delete user")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
