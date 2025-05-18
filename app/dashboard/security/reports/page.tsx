"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ReportItem } from "@/components/user-dashboard"; // Assuming ReportItem is a shared type
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { VerifyReportDialog } from "@/components/verify-report-dialog";

// Helper function to get the date from a report item
const getItemDate = (report: ReportItem): string => {
  if (report.type === "lost" && report.tanggal_hilang) {
    return report.tanggal_hilang;
  } else if (report.type === "found" && report.tanggal_temuan) {
    return report.tanggal_temuan;
  }
  return report.created_at || ""; // Fallback to created_at
};

// Helper function to map status to Badge variant
const getStatusBadgeVariant = (status?: string): BadgeProps["variant"] => {
  switch (status) {
    case "verified":
      return "default"; // Or your preferred variant for success
    case "reported":
      return "outline"; // Or destructive if you want it to be more prominent
    case "matched":
      return "secondary";
    case "returned":
      return "secondary";
    default:
      return "secondary";
  }
};

// Check if a report can have its status updated
const canUpdateStatus = (status?: string): boolean => {
  // Only allow updating if status is "verified" or "matched"
  return status === "verified" || status === "matched";
};

export default function AllSecurityReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  const fetchAllReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: lostItems, error: lostError } = await supabase
        .from("barang_hilang")
        .select("*, user:id_user(nama)")
        .order("created_at", { ascending: false });

      if (lostError) throw lostError;

      const { data: foundItems, error: foundError } = await supabase
        .from("barang_temuan")
        .select("*, user:id_user(nama)")
        .order("created_at", { ascending: false });

      if (foundError) throw foundError;

      const formattedLostItems: ReportItem[] = (lostItems || []).map(
        (item: any) => ({
          ...item,
          id_hilang: item.id_hilang,
          type: "lost" as const,
          reporter_name: item.user?.nama || "Unknown User",
        })
      );

      const formattedFoundItems: ReportItem[] = (foundItems || []).map(
        (item: any) => ({
          ...item,
          id_temuan: item.id_temuan,
          type: "found" as const,
          reporter_name: item.user?.nama || "Unknown User",
        })
      );

      const allReportsData = [...formattedLostItems, ...formattedFoundItems].sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
      setReports(allReportsData);
    } catch (err) {
      console.error("Error fetching all reports:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAllReports();
  }, []);

  const handleStatusUpdated = () => {
    // Reload data after updating a status
    fetchAllReports();
  };

  const openUpdateDialog = (report: ReportItem) => {
    setSelectedReport(report);
    setIsUpdateDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/security">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Security Dashboard</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">All Reports</h1>
      </div>

      {isLoading && <p>Loading reports...</p>}
      {error && <p className="text-red-500">Error loading reports: {error}</p>}

      {!isLoading && !error && reports.length === 0 && (
        <p>No reports found.</p>
      )}

      {!isLoading && !error && reports.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {reports.map((report) => {
            const reportId = report.type === "lost" ? report.id_hilang : report.id_temuan;
            const isUpdatable = canUpdateStatus(report.status);
            
            return (
              <Card key={`${report.type}-${reportId}`} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant={
                        report.type === "lost" ? "destructive" : "default"
                      }
                    >
                      {report.type === "lost" ? "Lost" : "Found"}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(report.status)}>
                      {report.status?.charAt(0).toUpperCase() + (report.status?.slice(1) || "")}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{report.nama_barang}</CardTitle>
                  <CardDescription>
                    {report.kategori} &bull;{" "}
                    {new Date(getItemDate(report)).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-2">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Location:</span> {report.lokasi}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    <span className="font-medium">Description:</span> {report.deskripsi}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Reported by: {report.reporter_name || "Unknown"}
                  </p>
                </CardContent>
                <CardFooter className="pt-2">
                  {isUpdatable ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => openUpdateDialog(report)}
                    >
                      Update Status
                    </Button>
                  ) : report.status === "returned" ? (
                    <p className="text-xs text-muted-foreground text-center w-full">
                      Item returned - no further actions
                    </p>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      disabled
                    >
                      Status not updatable
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      
      {selectedReport && (
        <VerifyReportDialog
          open={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          report={selectedReport}
          onVerified={handleStatusUpdated}
        />
      )}
    </div>
  );
} 