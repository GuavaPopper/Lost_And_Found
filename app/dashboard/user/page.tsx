"use client"

import { UserDashboard } from "@/components/user-dashboard"
import DashboardLayout from "@/components/dashboard-layout"
import { useProtectedRoute } from "@/hooks/use-protected-route"

export default function UserDashboardPage() {
  // Ensure only users with 'user' role can access this page
  const { isAuthenticated, isLoading } = useProtectedRoute(["user"])
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
  
  if (!isAuthenticated) {
    return null // The hook will handle redirection
  }

  return (
    <DashboardLayout role="user">
      <UserDashboard />
    </DashboardLayout>
  )
} 