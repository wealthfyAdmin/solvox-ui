export function getClientAccessToken(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split("; ");

  for (const c of cookies) {
    const [name, value] = c.split("=");
    if (name === "access_token") {
      console.log("found token:", decodeURIComponent(value));
      return decodeURIComponent(value);
    }
  }

  return null;
}
