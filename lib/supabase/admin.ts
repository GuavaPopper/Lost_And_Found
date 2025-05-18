import { supabase } from "@/lib/supabase"
import { ReportItem } from "@/components/user-dashboard"
import { ActivityLog } from "@/lib/supabase/security"

// Interface for admin dashboard stats
export interface AdminStats {
  totalUsers: number
  regularUsers: number
  securityUsers: number
  adminUsers: number
  totalReports: number
  lostReports: number
  foundReports: number
  pendingReports: number
  matchedReports: number
  verifiedReports: number
  returnedReports: number
}

// Interface for user data
export interface UserData {
  id: string
  name: string
  email: string
  role: "user" | "security" | "admin"
  createdAt: string
}

/**
 * Interface for monthly statistics
 */
export interface MonthlyStats {
  name: string
  lost: number
  found: number
  returned: number
}

/**
 * Get aggregated stats for the admin dashboard
 */
export async function getAdminStats(): Promise<AdminStats> {
  try {
    // Get counts for different types of users
    const [userCount, securityCount, adminCount, lostItemsCount, foundItemsCount] = await Promise.all([
      supabase.from("user").select("id_user", { count: 'exact', head: true }),
      supabase.from("satpam").select("id_satpam", { count: 'exact', head: true }),
      supabase.from("admin").select("id_admin", { count: 'exact', head: true }),
      supabase.from("barang_hilang").select("status", { count: 'exact' }),
      supabase.from("barang_temuan").select("status", { count: 'exact' })
    ]);

    // Calculate total users
    const totalUsers = (userCount.count || 0) + (securityCount.count || 0) + (adminCount.count || 0);
    
    // Handle lost and found items status counts
    const lostItems = lostItemsCount.data || [];
    const foundItems = foundItemsCount.data || [];
    
    // Combine all items for status counting
    const allItems = [...lostItems, ...foundItems];
    
    // Count items by status
    const pendingCount = allItems.filter(item => item.status === "reported").length;
    const matchedCount = allItems.filter(item => item.status === "matched").length;
    const verifiedCount = allItems.filter(item => item.status === "verified").length;
    const returnedCount = allItems.filter(item => item.status === "returned").length;
    
    return {
      totalUsers,
      regularUsers: userCount.count || 0,
      securityUsers: securityCount.count || 0,
      adminUsers: adminCount.count || 0,
      totalReports: lostItems.length + foundItems.length,
      lostReports: lostItems.length,
      foundReports: foundItems.length,
      pendingReports: pendingCount,
      matchedReports: matchedCount,
      verifiedReports: verifiedCount,
      returnedReports: returnedCount
    };
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return {
      totalUsers: 0,
      regularUsers: 0,
      securityUsers: 0,
      adminUsers: 0,
      totalReports: 0,
      lostReports: 0,
      foundReports: 0,
      pendingReports: 0,
      matchedReports: 0,
      verifiedReports: 0,
      returnedReports: 0
    };
  }
}

/**
 * Get recent users for the admin dashboard
 */
export async function getRecentUsers(limit: number = 5): Promise<UserData[]> {
  try {
    // Get recent regular users
    const { data: userData, error: userError } = await supabase
      .from("user")
      .select("id_user, nama, username, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (userError) throw userError;

    // Get recent security users
    const { data: securityData, error: securityError } = await supabase
      .from("satpam")
      .select("id_satpam, nama, username, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
      
    if (securityError) throw securityError;
    
    // Format regular users
    const formattedUsers = (userData || []).map(user => ({
      id: user.id_user,
      name: user.nama,
      email: user.username,
      role: "user" as const,
      createdAt: user.created_at
    }));
    
    // Format security users
    const formattedSecurity = (securityData || []).map(security => ({
      id: security.id_satpam,
      name: security.nama,
      email: security.username,
      role: "security" as const,
      createdAt: security.created_at
    }));
    
    // Combine and sort by creation date (newest first)
    return [...formattedUsers, ...formattedSecurity]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching recent users:", error);
    return [];
  }
}

/**
 * Get recent reports for the admin dashboard
 */
export async function getRecentReports(limit: number = 5): Promise<ReportItem[]> {
  try {
    // Get lost items
    const { data: lostItems, error: lostError } = await supabase
      .from("barang_hilang")
      .select("*, user:id_user(nama)")
      .order("created_at", { ascending: false })
      .limit(limit);
      
    if (lostError) throw lostError;
    
    // Get found items
    const { data: foundItems, error: foundError } = await supabase
      .from("barang_temuan")
      .select("*, user:id_user(nama)")
      .order("created_at", { ascending: false })
      .limit(limit);
      
    if (foundError) throw foundError;
    
    // Format lost items
    const formattedLostItems = (lostItems || []).map(item => ({
      id_hilang: item.id_hilang,
      type: "lost" as const,
      id_user: item.id_user,
      nama_barang: item.nama_barang,
      kategori: item.kategori,
      deskripsi: item.deskripsi,
      lokasi: item.lokasi,
      tanggal_hilang: item.tanggal_hilang,
      status: item.status,
      image: item.image,
      created_at: item.created_at,
      reporter_name: item.user?.nama || "Unknown User"
    }));
    
    // Format found items
    const formattedFoundItems = (foundItems || []).map(item => ({
      id_temuan: item.id_temuan,
      type: "found" as const,
      id_user: item.id_user,
      nama_barang: item.nama_barang,
      kategori: item.kategori,
      deskripsi: item.deskripsi,
      lokasi: item.lokasi,
      tanggal_temuan: item.tanggal_temuan,
      status: item.status,
      image: item.image,
      created_at: item.created_at,
      reporter_name: item.user?.nama || "Unknown User"
    }));
    
    // Combine and sort by creation date (newest first)
    return [...formattedLostItems, ...formattedFoundItems]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error("Error fetching recent reports:", error);
    return [];
  }
}

/**
 * Get recent activity logs for the admin dashboard
 */
export async function getRecentActivityLogs(limit: number = 5): Promise<ActivityLog[]> {
  try {
    const { data, error } = await supabase
      .from("log_aktivitas")
      .select("*, user:id_user(nama), security:id_satpam(nama), admin:id_admin(nama)")
      .order("timestamp", { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    return (data || []).map(log => ({
      id: log.id_log,
      action: log.aktivitas,
      item_name: "-",
      user_name: log.user?.nama || log.security?.nama || log.admin?.nama || "System",
      created_at: log.timestamp
    }));
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return [];
  }
}

/**
 * Log activity performed by an admin
 */
export async function logAdminActivity(
  adminId: string,
  action: string
): Promise<boolean> {
  try {
    const logData = {
      id_user: null,
      id_satpam: null,
      id_admin: adminId,
      aktivitas: action,
      timestamp: new Date().toISOString(),
    };
    
    const { error } = await supabase
      .from("log_aktivitas")
      .insert(logData);
      
    if (error) {
      console.error("Error logging admin activity:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error logging admin activity:", error);
    return false;
  }
}

/**
 * Get all activity logs for export
 */
export async function getAllActivityLogs(): Promise<ActivityLog[]> {
  try {
    const { data, error } = await supabase
      .from("log_aktivitas")
      .select("*, user:id_user(nama), security:id_satpam(nama), admin:id_admin(nama)")
      .order("timestamp", { ascending: false });
      
    if (error) throw error;
    
    return (data || []).map(log => ({
      id: log.id_log,
      action: log.aktivitas,
      item_name: "-",
      user_name: log.user?.nama || log.security?.nama || log.admin?.nama || "System",
      created_at: log.timestamp
    }));
  } catch (error) {
    console.error("Error fetching all activity logs:", error);
    return [];
  }
}

/**
 * Convert activity logs to CSV format
 */
export function convertLogsToCSV(logs: ActivityLog[]): string {
  // Define CSV headers
  const headers = ['ID', 'Action', 'Performed By', 'Timestamp'];
  
  // Convert logs to CSV rows
  const rows = logs.map(log => [
    log.id,
    log.action,
    log.user_name,
    new Date(log.created_at).toLocaleString()
  ]);
  
  // Combine headers and rows
  const allRows = [headers, ...rows];
  
  // Convert to CSV string
  return allRows.map(row => 
    row.map(cell => 
      // Wrap in quotes and escape existing quotes
      `"${String(cell).replace(/"/g, '""')}"`
    ).join(',')
  ).join('\n');
}

/**
 * Get monthly report statistics for the admin dashboard chart
 * Returns data for the last 6 months
 */
export async function getMonthlyReportStats(): Promise<MonthlyStats[]> {
  try {
    // Calculate the date 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Start of month
    sixMonthsAgo.setHours(0, 0, 0, 0);
    
    // Get lost items from the last 6 months
    const { data: lostItems, error: lostError } = await supabase
      .from("barang_hilang")
      .select("tanggal_hilang, status")
      .gte("created_at", sixMonthsAgo.toISOString());
      
    if (lostError) throw lostError;
    
    // Get found items from the last 6 months
    const { data: foundItems, error: foundError } = await supabase
      .from("barang_temuan")
      .select("tanggal_temuan, status")
      .gte("created_at", sixMonthsAgo.toISOString());
      
    if (foundError) throw foundError;
    
    // Initialize monthly data structure
    const monthlyData: Record<string, MonthlyStats> = {};
    
    // Get current month and year
    const currentDate = new Date();
    
    // Create entries for the last 6 months
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);
      
      const monthName = date.toLocaleString('default', { month: 'short' });
      monthlyData[`${date.getFullYear()}-${date.getMonth()}`] = {
        name: monthName,
        lost: 0,
        found: 0,
        returned: 0
      };
    }
    
    // Count lost items by month
    lostItems?.forEach(item => {
      const date = new Date(item.tanggal_hilang);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (monthlyData[key]) {
        monthlyData[key].lost += 1;
        
        // Count returned items from lost items
        if (item.status === 'returned') {
          monthlyData[key].returned += 1;
        }
      }
    });
    
    // Count found items by month
    foundItems?.forEach(item => {
      const date = new Date(item.tanggal_temuan);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (monthlyData[key]) {
        monthlyData[key].found += 1;
        
        // Also count returned items from found items
        if (item.status === 'returned') {
          monthlyData[key].returned += 1;
        }
      }
    });
    
    // Convert to array and sort by date (oldest first)
    return Object.values(monthlyData).reverse();
  } catch (error) {
    console.error("Error fetching monthly report stats:", error);
    
    // Return empty data with last 6 month names if there's an error
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(currentDate.getMonth() - i);
      months.push({
        name: date.toLocaleString('default', { month: 'short' }),
        lost: 0,
        found: 0,
        returned: 0
      });
    }
    
    return months;
  }
} 