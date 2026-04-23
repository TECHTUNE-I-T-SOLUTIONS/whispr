const KEY = "whispr-community-visitor-token"

export function getVisitorToken(): string {
  if (typeof window === "undefined") return ""
  try {
    let t = window.localStorage.getItem(KEY)
    if (!t) {
      t =
        (typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36)) + ""
      window.localStorage.setItem(KEY, t)
    }
    return t
  } catch {
    return "anon-" + Math.random().toString(36).slice(2)
  }
}
