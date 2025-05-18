"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { AdminDashboard } from "@/components/admin-dashboard"
import { useProtectedRoute } from "@/hooks/use-protected-route"

export default function AdminDashboardPage() {
  // Ensure only users with 'admin' role can access this page
  const { isAuthenticated, isLoading } = useProtectedRoute(["admin"])
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
  
  if (!isAuthenticated) {
    return null // The hook will handle redirection
  }

  return (
    <DashboardLayout role="admin">
      <AdminDashboard />
    </DashboardLayout>
  )
} 