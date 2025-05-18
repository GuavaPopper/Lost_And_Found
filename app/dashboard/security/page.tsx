"use client"

import DashboardLayout from "@/components/dashboard-layout"
import { SecurityDashboard } from "@/components/security-dashboard"
import { useProtectedRoute } from "@/hooks/use-protected-route"

export default function SecurityDashboardPage() {
  // Ensure only users with 'security' role can access this page
  const { isAuthenticated, isLoading } = useProtectedRoute(["security"])
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }
  
  if (!isAuthenticated) {
    return null // The hook will handle redirection
  }

  return (
    <DashboardLayout role="security">
      <SecurityDashboard />
    </DashboardLayout>
  )
} 