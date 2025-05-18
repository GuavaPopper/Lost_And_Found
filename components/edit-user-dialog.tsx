"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Save, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { logAdminActivity } from "@/lib/supabase/admin"

// Form schema for user editing
const userFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  identifier: z.string().min(2, {
    message: "NIM/NIP/KTA must be at least 2 characters.",
  }),
  username: z.string().min(3, {
    message: "Username must be at least 3 characters.",
  }),
  password: z.string().optional(),
})

interface EditUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userRole: string
  onUserUpdated: () => void
}

export function EditUserDialog({ 
  open, 
  onOpenChange, 
  userId, 
  userRole,
  onUserUpdated 
}: EditUserDialogProps) {
  const { toast } = useToast()
  const { user } = useAuth()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userData, setUserData] = useState<{
    id: string;
    name: string;
    email: string;
    identifier: string;
    role: string;
    createdAt: string;
  } | null>(null)

  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      identifier: "",
      username: "",
      password: "",
    },
  })

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !userRole || !open) return
      
      setIsLoading(true)
      
      try {
        let data = null
        let error = null
        
        // Fetch data based on role
        if (userRole === "user") {
          const result = await supabase
            .from("user")
            .select("id_user, nama, username, nim_nip, created_at")
            .eq("id_user", userId)
            .single()
          
          data = result.data
          error = result.error
          
          if (data) {
            setUserData({
              id: data.id_user,
              name: data.nama,
              email: data.username,
              identifier: data.nim_nip,
              role: "user",
              createdAt: data.created_at
            })
            
            form.reset({
              name: data.nama,
              identifier: data.nim_nip,
              username: data.username,
              password: "",
            })
          }
        } else if (userRole === "security") {
          const result = await supabase
            .from("satpam")
            .select("id_satpam, nama, username, kta, created_at")
            .eq("id_satpam", userId)
            .single()
          
          data = result.data
          error = result.error
          
          if (data) {
            setUserData({
              id: data.id_satpam,
              name: data.nama,
              email: data.username,
              identifier: data.kta,
              role: "security",
              createdAt: data.created_at
            })
            
            form.reset({
              name: data.nama,
              identifier: data.kta,
              username: data.username,
              password: "",
            })
          }
        } else if (userRole === "admin") {
          const result = await supabase
            .from("admin")
            .select("id_admin, nama, username, created_at")
            .eq("id_admin", userId)
            .single()
          
          data = result.data
          error = result.error
          
          if (data) {
            setUserData({
              id: data.id_admin,
              name: data.nama,
              email: data.username,
              identifier: "admin",
              role: "admin",
              createdAt: data.created_at
            })
            
            form.reset({
              name: data.nama,
              identifier: "admin",
              username: data.username,
              password: "",
            })
          }
        }
        
        if (error) {
          console.error("Error fetching user data:", error)
          toast({
            title: "Error",
            description: "Could not load user data. Please try again.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        toast({
          title: "Error",
          description: "Could not load user data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [userId, userRole, open, form, toast])

  const onSubmit = async (values: z.infer<typeof userFormSchema>) => {
    if (!userData) return
    
    setIsSaving(true)
    
    try {
      let result
      
      // Update based on role
      if (userData.role === "user") {
        const updateData: any = {
          nama: values.name,
          nim_nip: values.identifier,
          username: values.username,
        }
        
        // Only include password if provided
        if (values.password) {
          updateData.password = values.password
        }
        
        result = await supabase
          .from("user")
          .update(updateData)
          .eq("id_user", userData.id)
      } else if (userData.role === "security") {
        const updateData: any = {
          nama: values.name,
          kta: values.identifier,
          username: values.username,
        }
        
        // Only include password if provided
        if (values.password) {
          updateData.password = values.password
        }
        
        result = await supabase
          .from("satpam")
          .update(updateData)
          .eq("id_satpam", userData.id)
      } else if (userData.role === "admin") {
        const updateData: any = {
          nama: values.name,
          username: values.username,
        }
        
        // Only include password if provided
        if (values.password) {
          updateData.password = values.password
        }
        
        result = await supabase
          .from("admin")
          .update(updateData)
          .eq("id_admin", userData.id)
      }
      
      if (result?.error) {
        throw result.error
      }
      
      // Log the admin activity
      if (user && user.id_admin) {
        await logAdminActivity(
          user.id_admin,
          `Updated ${userData.role} account: ${values.name} (${values.username})`
        )
      }
      
      toast({
        title: "User updated",
        description: "User information has been updated successfully.",
      })
      
      // Update the local userData state to reflect changes
      setUserData({
        ...userData,
        name: values.name,
        email: values.username,
        identifier: values.identifier,
      })
      
      // Notify parent component that the user was updated
      onUserUpdated()
      
      // Close the dialog
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error updating user:", error)
      
      let errorMsg = "There was an error updating the user. Please try again."
      
      if (error.message) {
        if (error.message.includes("duplicate key")) {
          errorMsg = "A user with this NIM/NIP or username already exists."
        } else {
          errorMsg = `Error: ${error.message}`
        }
      }
      
      toast({
        title: "Update failed",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!userData) return
    
    setIsDeleting(true)
    
    try {
      let result
      
      // Delete based on role
      if (userData.role === "user") {
        result = await supabase
          .from("user")
          .delete()
          .eq("id_user", userData.id)
      } else if (userData.role === "security") {
        result = await supabase
          .from("satpam")
          .delete()
          .eq("id_satpam", userData.id)
      } else if (userData.role === "admin") {
        result = await supabase
          .from("admin")
          .delete()
          .eq("id_admin", userData.id)
      }
      
      if (result?.error) {
        throw result.error
      }
      
      // Log the admin activity
      if (user && user.id_admin) {
        await logAdminActivity(
          user.id_admin,
          `Deleted ${userData.role} account: ${userData.name} (${userData.email})`
        )
      }
      
      toast({
        title: "User deleted",
        description: "User has been deleted successfully.",
      })
      
      // Notify parent component that the user was updated/deleted
      onUserUpdated()
      
      // Close the dialogs
      setIsDeleteDialogOpen(false)
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error deleting user:", error)
      
      let errorMsg = "There was an error deleting the user. Please try again."
      
      if (error.message) {
        if (error.message.includes("foreign key constraint")) {
          errorMsg = "This user has associated records and cannot be deleted."
        } else {
          errorMsg = `Error: ${error.message}`
        }
      }
      
      toast({
        title: "Deletion failed",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {userData ? `Edit ${userData.role.charAt(0).toUpperCase() + userData.role.slice(1)} Profile` : "Edit User"}
          </DialogTitle>
          <DialogDescription>
            {userData ? `Update information for ${userData.name}` : "Update user information"}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Loading user data...</p>
          </div>
        ) : userData ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {userData.role !== "admin" && (
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{userData.role === "security" ? "KTA" : "NIM/NIP"}</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={userData.role === "security" ? "Security ID" : "Student/Staff ID"} 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        {userData.role === "security" 
                          ? "Security identification number" 
                          : "Student or staff identification number"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Leave blank to keep current password" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Only fill this if you want to change the password
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" className="w-full sm:w-auto">
                      <Trash className="mr-2 h-4 w-4" />
                      Delete User
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        user account and all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete} 
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Delete"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-sm text-muted-foreground">User not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 