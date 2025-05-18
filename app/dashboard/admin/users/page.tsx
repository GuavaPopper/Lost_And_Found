"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, Loader2, Search, UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { UserData } from "@/lib/supabase/admin"
import { supabase } from "@/lib/supabase"
import { CreateUserDialog } from "@/components/create-user-dialog"
import { EditUserDialog } from "@/components/edit-user-dialog"

// Extend the UserData interface for local use
interface ExtendedUserData extends UserData {
  identifier?: string;
}

export default function AllUsersPage() {
  const [users, setUsers] = useState<ExtendedUserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<ExtendedUserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{id: string, role: string} | null>(null)

  // Fetch all users
  useEffect(() => {
    const fetchAllUsers = async () => {
      setIsLoading(true)
      try {
        // Fetch regular users
        const { data: userData, error: userError } = await supabase
          .from("user")
          .select("id_user, nama, username, created_at, nim_nip")
        
        if (userError) throw userError

        // Fetch security users
        const { data: securityData, error: securityError } = await supabase
          .from("satpam")
          .select("id_satpam, nama, username, created_at, kta")
        
        if (securityError) throw securityError

        // Fetch admin users
        const { data: adminData, error: adminError } = await supabase
          .from("admin")
          .select("id_admin, nama, username, created_at")
        
        if (adminError) throw adminError

        // Format the data
        const formattedUsers = [
          ...(userData || []).map(user => ({
            id: user.id_user,
            name: user.nama,
            email: user.username,
            identifier: user.nim_nip,
            role: "user" as const,
            createdAt: user.created_at
          })),
          ...(securityData || []).map(security => ({
            id: security.id_satpam,
            name: security.nama,
            email: security.username,
            identifier: security.kta,
            role: "security" as const,
            createdAt: security.created_at
          })),
          ...(adminData || []).map(admin => ({
            id: admin.id_admin,
            name: admin.nama,
            email: admin.username,
            identifier: "admin",
            role: "admin" as const,
            createdAt: admin.created_at
          }))
        ].sort((a, b) => {
          const dateA = new Date(a.createdAt || 0)
          const dateB = new Date(b.createdAt || 0)
          return dateB.getTime() - dateA.getTime()
        })

        setUsers(formattedUsers)
        setFilteredUsers(formattedUsers)
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAllUsers()
  }, [])

  // Filter users based on search query and role filter
  useEffect(() => {
    let result = [...users]
    
    // Apply role filter
    if (roleFilter !== "all") {
      result = result.filter(user => user.role === roleFilter)
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        user => 
          user.name.toLowerCase().includes(query) || 
          user.email.toLowerCase().includes(query) ||
          user.identifier?.toLowerCase().includes(query)
      )
    }
    
    setFilteredUsers(result)
  }, [users, searchQuery, roleFilter])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Get appropriate badge color based on role
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "security":
        return "secondary"
      default:
        return "outline"
    }
  }

  // Handle refreshing the user list after edits
  const handleUserUpdated = async () => {
    // Reload user data
    setIsLoading(true)
    try {
      // Fetch regular users
      const { data: userData, error: userError } = await supabase
        .from("user")
        .select("id_user, nama, username, created_at, nim_nip")
      
      if (userError) throw userError

      // Fetch security users
      const { data: securityData, error: securityError } = await supabase
        .from("satpam")
        .select("id_satpam, nama, username, created_at, kta")
      
      if (securityError) throw securityError

      // Fetch admin users
      const { data: adminData, error: adminError } = await supabase
        .from("admin")
        .select("id_admin, nama, username, created_at")
      
      if (adminError) throw adminError

      // Format the data
      const formattedUsers = [
        ...(userData || []).map(user => ({
          id: user.id_user,
          name: user.nama,
          email: user.username,
          identifier: user.nim_nip,
          role: "user" as const,
          createdAt: user.created_at
        })),
        ...(securityData || []).map(security => ({
          id: security.id_satpam,
          name: security.nama,
          email: security.username,
          identifier: security.kta,
          role: "security" as const,
          createdAt: security.created_at
        })),
        ...(adminData || []).map(admin => ({
          id: admin.id_admin,
          name: admin.nama,
          email: admin.username,
          identifier: "admin",
          role: "admin" as const,
          createdAt: admin.created_at
        }))
      ].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0)
        const dateB = new Date(b.createdAt || 0)
        return dateB.getTime() - dateA.getTime()
      })

      setUsers(formattedUsers)
      setFilteredUsers(formattedUsers)
    } catch (error) {
      console.error("Error refreshing users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle opening the edit user dialog
  const handleEditUser = (user: ExtendedUserData) => {
    setSelectedUser({
      id: user.id,
      role: user.role
    })
    setIsEditUserDialogOpen(true)
  }

  return (
    <div className="container px-0 mx-auto flex flex-col h-full max-w-7xl">
      {/* Page Header */}
      <div className="sticky top-0 z-10 bg-background pt-6 pb-4 px-4 sm:px-6 flex items-center justify-between border-b">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/admin">
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">All Users</h1>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsCreateUserDialogOpen(true)}
          className="hidden sm:flex"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
          <Button 
            variant="outline" 
            onClick={() => setIsCreateUserDialogOpen(true)}
            className="sm:hidden flex-1"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Create User
          </Button>
          <div className="text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <Card className="flex-grow mx-4 sm:mx-6 mb-6 border rounded-lg shadow-sm overflow-hidden">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b bg-muted/40">
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage users, security personnel, and administrators</CardDescription>
        </CardHeader>
        
        <CardContent className="flex-grow p-0 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 p-8">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-3" />
              <span className="text-lg font-medium text-muted-foreground">Loading users...</span>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="divide-y">
              {filteredUsers.map((user) => (
                <div
                  key={`${user.role}-${user.id}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-muted/50"
                >
                  <div className="space-y-1 mb-3 sm:mb-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.name}</span>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.identifier && (
                      <p className="text-xs text-muted-foreground">
                        {user.role === "security" ? "KTA: " : user.role === "user" ? "NIM/NIP: " : ""}
                        {user.identifier}
                      </p>
                    )}
                  </div>
                  <div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 p-8 text-center">
              <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl font-semibold mb-1">No users found</p>
              <p className="text-sm text-muted-foreground">
                {searchQuery || roleFilter !== "all"
                  ? "Try adjusting your search or filter"
                  : "Add users to get started"}
              </p>
            </div>
          )}
        </CardContent>
        
        {filteredUsers.length > 0 && (
          <CardFooter className="flex justify-end border-t px-4 pt-4 sm:px-6 sm:pt-6 py-3 bg-card">
            <div className="text-sm text-muted-foreground">
              Displaying {filteredUsers.length} of {users.length} user entries.
            </div>
          </CardFooter>
        )}
      </Card>
      
      <CreateUserDialog 
        open={isCreateUserDialogOpen} 
        onOpenChange={setIsCreateUserDialogOpen} 
      />
      
      {selectedUser && (
        <EditUserDialog
          open={isEditUserDialogOpen}
          onOpenChange={setIsEditUserDialogOpen}
          userId={selectedUser.id}
          userRole={selectedUser.role}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </div>
  )
} 