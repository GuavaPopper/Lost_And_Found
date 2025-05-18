"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export type UserRole = "user" | "security" | "admin"

interface AuthUser {
  id: string
  username: string
  role: UserRole
  nama: string
  id_user?: string   // For regular user
  id_satpam?: string // For security personnel
  id_admin?: string  // For admin
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (username: string, password: string, role: UserRole) => Promise<boolean>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check for existing session on load
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const signIn = async (username: string, password: string, role: UserRole): Promise<boolean> => {
    setLoading(true)
    
    try {
      let userId = ""
      let userNama = ""
      
      if (role === "user") {
        const { data: userData, error } = await supabase
          .from("user")
          .select("id_user, nama, username, password")
          .eq("username", username)
          .single()
        
        console.log('User login attempt:', { userData, error })
        
        if (error) {
          console.error("Error querying user:", error)
          return false
        }
          
        if (userData && userData.password === password) {
          userId = userData.id_user
          userNama = userData.nama
        }
      } else if (role === "security") {
        const { data: securityData, error } = await supabase
          .from("satpam")
          .select("id_satpam, nama, username, password")
          .eq("username", username)
          .single()
        
        console.log('Security login attempt:', { securityData, error })
        
        if (error) {
          console.error("Error querying security:", error)
          return false
        }
          
        if (securityData && securityData.password === password) {
          userId = securityData.id_satpam
          userNama = securityData.nama
        }
      } else if (role === "admin") {
        const { data: adminData, error } = await supabase
          .from("admin")
          .select("id_admin, nama, username, password")
          .eq("username", username)
          .single()
        
        console.log('Admin login attempt:', { adminData, error })
        
        if (error) {
          console.error("Error querying admin:", error)
          return false
        }
          
        if (adminData && adminData.password === password) {
          userId = adminData.id_admin
          userNama = adminData.nama
        }
      }

      if (userId) {
        const authUser: AuthUser = {
          id: userId,
          username,
          nama: userNama,
          role
        }
        
        // Add role-specific IDs
        if (role === "user") {
          authUser.id_user = userId;
        } else if (role === "security") {
          authUser.id_satpam = userId;
        } else if (role === "admin") {
          authUser.id_admin = userId;
        }
        
        // Store user info in local storage (not secure, just for demonstration)
        localStorage.setItem("user", JSON.stringify(authUser))
        setUser(authUser)
        return true
      }
      return false
    } catch (error) {
      console.error("Error signing in:", error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    localStorage.removeItem("user")
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
} 