import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

async function getAuthHeaders(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("access_token")?.value;

  let token: string | null = null;
  if (authHeader) token = authHeader.startsWith("Bearer ") ? authHeader : `Bearer ${authHeader}`;
  else if (cookieToken) token = `Bearer ${cookieToken}`;

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: token }),
  };
}

export function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

/**
 * GET /api/organizations
 */
export async function GET(req: NextRequest) {
  try {
    const headers = await getAuthHeaders(req);

    const response = await fetch(`${BACKEND_URL}/api/organization/?skip=0&limit=100`, {
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("[GET Organizations Error]:", response.status, errorText);
      return NextResponse.json({ organizations: [] }, { status: 200 });
    }

    const backendData = await response.json();
    const backendOrganizations = backendData.organizations || [];

    const organizations = backendOrganizations.map((org: any) => ({
      id: String(org.id),
      name: org.name,
      description: org.description,
      created_at: org.created_at,
      updated_at: org.updated_at,
      is_active: org.is_active,
    }));

    return NextResponse.json({ organizations });
  } catch (err) {
    console.error("[GET Organizations Exception]:", err);
    return NextResponse.json({ organizations: [] }, { status: 200 });
  }
}

/**
 * POST /api/organizations
 */
export async function POST(req: NextRequest) {
  try {
    const headers = await getAuthHeaders(req);
    const body = await req.json();

    const response = await fetch(`${BACKEND_URL}/api/organization`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await response.text().catch(() => "");
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }

    return NextResponse.json(data ?? {}, { status: response.status });
  } catch (err) {
    console.error("[POST Organizations Exception]:", err);
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }
}
