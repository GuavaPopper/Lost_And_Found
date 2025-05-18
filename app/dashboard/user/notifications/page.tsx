"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AlertCircle, ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, Notification } from "@/lib/supabase/notifications"

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load notifications
  useEffect(() => {
    if (user) {
      const userNotifications = getUserNotifications(user.id)
      setNotifications(userNotifications)
      setIsLoading(false)
    }
  }, [user])

  // Mark a notification as read
  const handleNotificationClick = (notification: Notification) => {
    if (!user) return
    
    if (!notification.isRead) {
      markNotificationAsRead(user.id, notification.id)
      
      // Update local state
      setNotifications(notifications.map(n => 
        n.id === notification.id 
          ? { ...n, isRead: true } 
          : n
      ))
    }
  }

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    if (!user) return
    
    markAllNotificationsAsRead(user.id)
    
    // Update local state
    setNotifications(notifications.map(n => ({ ...n, isRead: true })))
  }

  // Get notification badge color based on type
  const getNotificationBadgeVariant = (type: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (type) {
      case 'report':
        return 'secondary'
      case 'verification':
        return 'outline'
      case 'match':
        return 'default'
      case 'return':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Format notification type for display
  const formatNotificationType = (type: string): string => {
    switch (type) {
      case 'report':
        return 'Report'
      case 'verification':
        return 'Verification'
      case 'match':
        return 'Match'
      case 'return':
        return 'Return'
      default:
        return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/user">
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Notifications</CardTitle>
          <CardDescription>
            Stay updated on your reports and potential matches
            {unreadCount > 0 && ` • ${unreadCount} unread`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-4">Loading notifications...</div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 rounded-lg border p-4 ${!notification.isRead ? "bg-muted/50" : ""}`}
                  onClick={() => handleNotificationClick(notification)}
                  role="button"
                  tabIndex={0}
                >
                  <AlertCircle className={`h-5 w-5 shrink-0 ${!notification.isRead ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={getNotificationBadgeVariant(notification.type)}>
                        {formatNotificationType(notification.type)}
                      </Badge>
                      {!notification.isRead && (
                        <Badge variant="secondary" className="h-1.5 w-1.5 rounded-full p-0" />
                      )}
                    </div>
                    <p className={`${!notification.isRead ? "font-medium" : ""}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm text-muted-foreground">
                You'll be notified when there are updates to your items
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 