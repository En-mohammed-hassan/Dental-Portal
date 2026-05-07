import type { ZodError } from "zod"

export function formatZodIssues(error: ZodError): { message: string; issues: string[] } {
  const issues = error.issues.map((issue) => {
    const path = issue.path.length ? `${issue.path.join(".")}: ` : ""
    return `${path}${issue.message}`
  })
  return {
    message: issues.join("; ") || "Invalid payload",
    issues,
  }
}
