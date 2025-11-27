// lib/error.ts
export async function extractErrorMessage(res: Response, fallback = "Something went wrong") {
  try {
    const data = await res.json();
    // prefer common fields
    return data?.error || data?.message || fallback;
  } catch {
    const text = await res.text().catch(() => "");
    return text || fallback;
  }
}
