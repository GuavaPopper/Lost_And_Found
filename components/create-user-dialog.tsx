"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { logAdminActivity } from "@/lib/supabase/admin"

const formSchema = z
  .object({
    name: z.string().min(2, {
      message: "Name must be at least 2 characters.",
    }),
    nimNip: z.string().min(2, {
      message: "NIM/NIP must be at least 2 characters.",
    }),
    username: z.string().min(3, {
      message: "Username must be at least 3 characters.",
    }),
    role: z.enum(["user", "security"], {
      required_error: "Please select a role.",
    }),
    password: z.string().min(6, {
      message: "Password must be at least 6 characters.",
    }),
    confirmPassword: z.string().min(6, {
      message: "Password must be at least 6 characters.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      nimNip: "",
      username: "",
      role: "user",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      // Determine which table to insert into based on role
      const table = values.role === "user" ? "user" : "satpam";
      
      console.log(`Creating new ${values.role} account in table: ${table}`);
      
      let result;
      
      // For regular users, use the standard insert
      if (values.role === "user") {
        // Create user data object
        const userData = {
          nama: values.name,
          nim_nip: values.nimNip,
          username: values.username,
          password: values.password,
          created_at: new Date().toISOString(),
        };
        
        result = await supabase.from("user").insert(userData);
        
        if (result.error) {
          console.error("Error inserting into user table:", result.error);
          throw result.error;
        }
      } 
      // For security accounts, use the stored procedure we created
      else {
        // Call the stored procedure using SQL
        const { data, error } = await supabase.rpc(
          'create_security_account',
          {
            p_nama: values.name,
            p_nim_nip: values.nimNip,
            p_username: values.username,
            p_password: values.password
          }
        );
        
        if (error) {
          console.error("Error creating security account via function:", error);
          
          // If error contains details, log them
          if (error.details) {
            console.error("Error details:", error.details);
          }
          
          throw error;
        }
        
        console.log("Security account created via function:", data);
        result = { data, error: null };
      }
      
      console.log(`Successfully created ${values.role} account:`, result.data);
      
      // Log the admin activity
      if (user && user.id_admin) {
        await logAdminActivity(
          user.id_admin,
          `Created new ${values.role} account for ${values.name} (${values.username})`
        );
      }
      
      toast({
        title: "User created",
        description: `${values.name} has been added as a ${values.role} successfully.`,
      })

      // Close the dialog and reset form
      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      console.error("Error creating user:", error);
      
      let errorMsg = "There was an error creating the user. Please try again.";
      
      if (error.message) {
        if (error.message.includes("duplicate key")) {
          errorMsg = "A user with this NIM/NIP or username already exists.";
        } else if (error.message.includes("does not exist")) {
          errorMsg = "The system cannot create this account type. Please contact an administrator.";
        } else {
          errorMsg = `Error: ${error.message}`;
        }
      }
      
      if (error.details) {
        console.error("Error details:", error.details);
      }
        
      toast({
        title: "Creation failed",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>Add a new user to the lost and found system.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>This determines the user's access level in the system.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nimNip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{form.watch("role") === "security" ? "KTA" : "NIM/NIP"}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={form.watch("role") === "security" ? "S12345" : "D10411xxxx"} 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    {form.watch("role") === "security" 
                      ? "Enter security registry number (KTA)" 
                      : "Enter student ID (NIM) or staff ID (NIP)"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
