"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, UserRole } from "@/hooks/use-auth"

export function useProtectedRoute(allowedRoles: UserRole[]) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to login if not authenticated
      router.push("/login")
    } else if (!loading && user && !allowedRoles.includes(user.role)) {
      // Redirect to appropriate dashboard if role doesn't match
      switch (user.role) {
        case "user":
          router.push("/dashboard/user")
          break
        case "security":
          router.push("/dashboard/security")
          break
        case "admin":
          router.push("/dashboard/admin")
          break
        default:
          router.push("/login")
      }
    }
  }, [loading, user, router, allowedRoles])

  return { isAuthenticated: !!user, user, isLoading: loading }
} 