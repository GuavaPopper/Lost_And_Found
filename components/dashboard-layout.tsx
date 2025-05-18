"use client"

import { type ReactNode, useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, ClipboardList, Home, LogOut, Search, Settings, Users } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/mode-toggle"
import { Badge } from "@/components/ui/badge"
import { useAuth, UserRole } from "@/hooks/use-auth"
import { getUserNotifications } from "@/lib/supabase/notifications"

interface MenuItem {
  href: string
  label: string
  icon: React.ElementType
  badge?: number
}

interface DashboardLayoutProps {
  children: ReactNode
  role: UserRole
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [notificationCount, setNotificationCount] = useState(0)
  const { user, signOut } = useAuth()
  
  // Load unread notification count
  useEffect(() => {
    if (user && role === "user") {
      // Get notifications and count unread ones
      const userNotifications = getUserNotifications(user.id)
      const unreadCount = userNotifications.filter(n => !n.isRead).length
      setNotificationCount(unreadCount)
    }
  }, [user, role, pathname]) // Include pathname to update count when navigating
  
  const userMenuItems: MenuItem[] = [
    { href: "/dashboard/user", label: "Dashboard", icon: Home },
    { href: "/dashboard/user/report", label: "Report Item", icon: ClipboardList },
    { href: "/dashboard/user/search", label: "Search Items", icon: Search },
    { href: "/dashboard/user/notifications", label: "Notifications", icon: Bell, badge: notificationCount > 0 ? notificationCount : undefined },
  ]

  const securityMenuItems: MenuItem[] = [
    { href: "/dashboard/security", label: "Dashboard", icon: Home },
    { href: "/dashboard/security/reports", label: "Verify Reports", icon: ClipboardList },
  ]

  const adminMenuItems: MenuItem[] = [
    { href: "/dashboard/admin", label: "Dashboard", icon: Home },
    { href: "/dashboard/admin/users", label: "Manage Users", icon: Users },
    { href: "/dashboard/admin/reports", label: "Manage Reports", icon: ClipboardList },
    { href: "/dashboard/admin/logs", label: "Activity Logs", icon: Search },
    { href: "/dashboard/admin/settings", label: "Settings", icon: Settings },
  ]

  const menuItems = role === "user" ? userMenuItems : role === "security" ? securityMenuItems : adminMenuItems

  const roleTitle = role === "user" ? "User Dashboard" : role === "security" ? "Security Dashboard" : "Admin Dashboard"

  const handleSignOut = () => {
    signOut()
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar className="border-r shadow-sm">
          <SidebarHeader className="flex flex-col gap-2 px-5 py-4 border-b">
            <div className="flex items-center gap-2 py-1">
              <div className="rounded-md bg-primary p-1.5 text-primary-foreground">
                <ClipboardList className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold">FT UNTAN Lost & Found</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-2 py-2">
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href} className="mb-1">
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === item.href}
                    className="py-2.5"
                  >
                    <Link href={item.href} className="font-medium">
                      <item.icon className="h-5 w-5 mr-3" />
                      <span>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge className="ml-auto" variant="destructive">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t p-4 mt-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
                  <AvatarFallback className="font-medium">{user?.nama?.substring(0, 2) || role.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user?.nama || role.charAt(0).toUpperCase() + role.slice(1)}</p>
                  <p className="text-xs text-muted-foreground">{user?.username || 'Not logged in'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ModeToggle />
                <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
            <SidebarTrigger className="h-9 w-9" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold">{roleTitle}</h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 w-full">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
