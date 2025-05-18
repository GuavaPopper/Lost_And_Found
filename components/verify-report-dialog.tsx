"use client"

import { useState, useEffect } from "react"
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { ReportItem } from "@/components/user-dashboard"
import { verifyReport } from "@/lib/supabase/security"
import { addNotification } from "@/lib/supabase/notifications"

// Create a schema factory function that returns the appropriate schema based on current status
const createFormSchema = (currentStatus?: string) => {
  // Define which status values are allowed based on current status
  let allowedStatuses: string[] = ["verified", "matched", "returned"];
  
  // If current status is "returned", don't allow changes (but shouldn't get here)
  if (currentStatus === "returned") {
    allowedStatuses = ["returned"];
  }
  // For verified status, allow transitioning to matched or returned
  else if (currentStatus === "verified") {
    allowedStatuses = ["verified", "matched", "returned"];
  }
  // For matched status, allow transitioning to matched or returned
  else if (currentStatus === "matched") {
    allowedStatuses = ["matched", "returned"];
  }
  
  return z.object({
    status: z.enum(allowedStatuses as [string, ...string[]], {
      required_error: "Please select a status.",
  }),
  notes: z.string().optional(),
  });
};

interface VerifyReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  report: ReportItem
  onVerified?: () => void
}

export function VerifyReportDialog({ open, onOpenChange, report, onVerified }: VerifyReportDialogProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formSchema, setFormSchema] = useState(() => createFormSchema(report.status));
  
  // Update form schema when report changes
  useEffect(() => {
    setFormSchema(createFormSchema(report.status));
  }, [report.status]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // Default to current status, but cast as appropriate type for the schema
      status: report.status as any || "verified",
      notes: "",
    },
  });

  // Reset form when dialog opens with a new report
  useEffect(() => {
    if (open) {
      form.reset({
        status: report.status as any || "verified",
        notes: "",
      });
    }
  }, [open, report, form]);

  // Check if the report is in returned status - should not be editable
  const isReturned = report.status === "returned";

  // Helper function to get the appropriate ID
  const getReportId = () => {
    return report.type === "lost" ? report.id_hilang : report.id_temuan
  }

  // Helper function to get the date
  const getItemDate = (): string => {
    return report.type === "lost" ? report.tanggal_hilang || "" : report.tanggal_temuan || ""
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Don't allow updates if item is already returned
    if (isReturned) {
      toast({
        title: "Cannot update",
        description: "Items marked as 'returned' cannot be modified.",
        variant: "destructive",
      });
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const reportId = getReportId();
      if (!reportId) {
        throw new Error("Missing report ID");
      }
      
      console.log(`Updating ${report.type} report with ID: ${reportId}`);
      console.log(`Status: ${values.status}, Notes: ${values.notes || "none"}`);
      
      // Directly pass the status to update in the database
      const success = await verifyReport(
        report.type, 
        reportId, 
        values.status as "verified" | "matched" | "returned", // Directly use the selected status
        values.notes,
        user?.id
      );

      if (!success) {
        throw new Error("Status update failed - check console for details");
      }

      // Create notification for the report owner
      if (report.id_user) {
        const notificationMessages = {
          verified: `Your ${report.type} item '${report.nama_barang}' has been verified by security.`,
          matched: `Your ${report.type} item '${report.nama_barang}' has been matched with a corresponding item.`,
          returned: `Your ${report.type} item '${report.nama_barang}' has been marked as returned.`
        };
        
        const notificationTypes = {
          verified: "verification" as const,
          matched: "match" as const,
          returned: "return" as const
        };
        
        // Add notification for the user
        addNotification(
          report.id_user,
          {
            message: notificationMessages[values.status as keyof typeof notificationMessages],
            type: notificationTypes[values.status as keyof typeof notificationTypes],
            isRead: false,
            relatedItemId: reportId
          }
        );
      }

      // Status-specific success messages
      const statusMessages = {
        verified: "verified and is now visible to all users",
        matched: "matched with a corresponding item",
        returned: "marked as returned to its owner"
      };

      toast({
        title: "Status Updated",
        description: `The item has been ${statusMessages[values.status as keyof typeof statusMessages]}.`,
      });

      // Close the dialog and reset form
      onOpenChange(false);
      form.reset();
      
      if (onVerified) {
        onVerified();
      }
      
    } catch (error) {
      console.error("Dialog error handling status update:", error);
      
      let errorMessage = "There was an error updating the item status. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Status update failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Item Status</DialogTitle>
          <DialogDescription>
            {isReturned 
              ? "This item has been returned and cannot be modified." 
              : "Review and update the status of this item."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={report.type === "lost" ? "destructive" : "default"}>
                {report.type === "lost" ? "Lost" : "Found"}
              </Badge>
              <h3 className="font-semibold">{report.nama_barang}</h3>
            </div>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Location:</span> {report.lokasi}
              </p>
              <p>
                <span className="font-medium">Date:</span> {new Date(getItemDate()).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Category:</span> {report.kategori}
              </p>
              <p>
                <span className="font-medium">Description:</span> {report.deskripsi}
              </p>
              <p>
                <span className="font-medium">Reported by:</span> {report.reporter_name || "Unknown User"}
              </p>
              <div className="flex items-center gap-1 text-sm">
                <span className="font-medium">Current Status:</span>{" "}
                <Badge variant="outline">{report.status || "reported"}</Badge>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isReturned}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select item status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Show verified option if current status allows it */}
                        {(report.status !== "returned" && report.status !== "matched") && (
                        <SelectItem value="verified">Verified</SelectItem>
                        )}
                        {/* Show matched option if current status allows it */}
                        {report.status !== "returned" && (
                          <SelectItem value="matched">Matched</SelectItem>
                        )}
                        {/* Always show returned as an option for non-returned items */}
                        {report.status !== "returned" && (
                          <SelectItem value="returned">Returned</SelectItem>
                        )}
                        {/* If already returned, just show that */}
                        {report.status === "returned" && (
                          <SelectItem value="returned">Returned (Final)</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes or comments about this status update..."
                        className="min-h-[100px]"
                        {...field}
                        disabled={isReturned}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  {isReturned ? "Close" : "Cancel"}
                </Button>
                {!isReturned && (
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Updating..." : "Update Status"}
                </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
