import { supabase } from "@/lib/supabase"
import { ReportItem } from "@/components/user-dashboard"

// Interface for security dashboard stats
export interface SecurityStats {
  total: number
  lost: number
  found: number
  pending: number
  verified: number
  matched: number
  returned: number
}

// Interface for activity logs
export interface ActivityLog {
  id: string
  action: string
  item_name: string
  user_name: string
  created_at: string
}

// Get pending reports that need verification
export async function getPendingReports(): Promise<ReportItem[]> {
  try {
    // Get lost items pending verification
    const { data: lostItems, error: lostError } = await supabase
      .from("barang_hilang")
      .select("*, user:id_user(nama)")
      .eq("status", "reported")
      .order("created_at", { ascending: false })
    
    if (lostError) throw lostError
    
    // Get found items pending verification
    const { data: foundItems, error: foundError } = await supabase
      .from("barang_temuan")
      .select("*, user:id_user(nama)")
      .eq("status", "reported")
      .order("created_at", { ascending: false })
    
    if (foundError) throw foundError
    
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
    }))
    
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
    }))
    
    // Combine and sort by creation date (newest first)
    return [
      ...formattedLostItems,
      ...formattedFoundItems
    ].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } catch (error) {
    console.error("Error fetching pending reports:", error)
    return []
  }
}

// Get security dashboard stats
export async function getSecurityStats(): Promise<SecurityStats> {
  try {
    // Get total counts from lost items
    const { data: lostCounts, error: lostError } = await supabase
      .from("barang_hilang")
      .select("status")
    
    if (lostError) throw lostError
    
    // Get total counts from found items
    const { data: foundCounts, error: foundError } = await supabase
      .from("barang_temuan")
      .select("status")
    
    if (foundError) throw foundError
    
    // Calculate stats
    const lostTotal = lostCounts?.length || 0
    const foundTotal = foundCounts?.length || 0
    
    // Combine all statuses from both lost and found tables
    const allStatusItems = [
      ...(lostCounts || []),
      ...(foundCounts || [])
    ];
    
    const pendingCount = allStatusItems.filter(item => item.status === "reported").length;
    const verifiedCount = allStatusItems.filter(item => item.status === "verified").length;
    const matchedCount = allStatusItems.filter(item => item.status === "matched").length;
    const returnedCount = allStatusItems.filter(item => item.status === "returned").length;
    
    return {
      total: lostTotal + foundTotal,
      lost: lostTotal,
      found: foundTotal,
      pending: pendingCount,
      verified: verifiedCount,
      matched: matchedCount,
      returned: returnedCount
    }
  } catch (error) {
    console.error("Error fetching security stats:", error)
    return {
      total: 0,
      lost: 0,
      found: 0,
      pending: 0,
      verified: 0,
      matched: 0,
      returned: 0
    }
  }
}

// Get recent activity logs
export async function getRecentActivityLogs(limit: number = 5): Promise<ActivityLog[]> {
  try {
    const { data, error } = await supabase
      .from("log_aktivitas")
      .select("*, user:id_user(nama), security:id_satpam(nama), admin:id_admin(nama)")
      .order("timestamp", { ascending: false })
      .limit(limit)
    
    if (error) throw error
    
    return (data || []).map(log => ({
      id: log.id_log,
      action: log.aktivitas,
      item_name: "-",
      user_name: log.user?.nama || log.security?.nama || log.admin?.nama || "System",
      created_at: log.timestamp
    }))
  } catch (error) {
    console.error("Error fetching activity logs:", error)
    return []
  }
}

// Verify a report
export async function verifyReport(
  reportType: "lost" | "found",
  reportId: string,
  status: "verified" | "matched" | "returned", // Update allowed status values
  notes?: string,
  securityId?: string,
  adminId?: string
): Promise<boolean> {
  try {
    console.log("Updating report status with params:", { reportType, reportId, status, notes, securityId, adminId });
    
    // Determine which table to update
    const table = reportType === "lost" ? "barang_hilang" : "barang_temuan"
    const idField = reportType === "lost" ? "id_hilang" : "id_temuan"
    
    console.log(`Using table: ${table}, id field: ${idField}`);
    
    // First, check if the report exists
    const { data: checkData, error: checkError } = await supabase
      .from(table)
      .select("nama_barang")
      .eq(idField, reportId)
      .maybeSingle();
      
    if (checkError) {
      console.error("Error checking if report exists:", checkError);
      throw checkError;
    }
    
    if (!checkData) {
      console.error(`Report with ID ${reportId} not found in ${table}`);
      throw new Error(`Report not found: ${reportId}`);
    }
    
    console.log("Report found:", checkData);
    
    // Get the report details for log entry
    const { data: reportData, error: reportError } = await supabase
      .from(table)
      .select("nama_barang, id_user")
      .eq(idField, reportId)
      .single()
    
    if (reportError) {
      console.error("Error fetching report for verification:", reportError);
      throw reportError;
    }
    
    console.log("Report data retrieved:", reportData);
    
    // Update the report status directly with the provided status
    console.log(`Updating ${table} with ID ${reportId} to status: ${status}`);
    
    const updateResult = await supabase
      .from(table)
      .update({ 
        status: status, // Use the provided status directly
      })
      .eq(idField, reportId);
      
    const updateError = updateResult.error;
    
    if (updateError) {
      console.error("Error updating report status:", updateError);
      console.error("Full update result:", updateResult);
      throw updateError;
    }
    
    console.log("Update successful:", updateResult);
    
    // Map status to human-readable action for logs
    const actionMap = {
      verified: "verified",
      matched: "marked as matched",
      returned: "marked as returned to owner"
    };
    
    // Log the activity with status
    const logData = {
      id_user: null, // Regular user ID is null for security/admin actions
      id_satpam: securityId || null, // Set the security personnel ID if available
      id_admin: adminId || null, // Set the admin ID if available
      aktivitas: `${reportType === "lost" ? "Lost" : "Found"} item "${reportData?.nama_barang}" ${actionMap[status]}${notes ? `: ${notes}` : ''}`,
      timestamp: new Date().toISOString()
    };
    
    console.log("Creating activity log:", logData);
    
    const logResult = await supabase
      .from("log_aktivitas")
      .insert(logData);
      
    const logError = logResult.error;
    
    if (logError) {
      console.error("Error creating activity log:", logError);
      console.error("Full log result:", logResult);
      // Don't throw here - we'll consider the update successful even if logging fails
      console.warn("Continuing despite log error");
    } else {
      console.log("Log created successfully");
    }
    
    return true;
  } catch (error) {
    console.error("Error updating report status:", error);
    return false;
  }
} 