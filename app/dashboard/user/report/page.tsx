"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import * as z from "zod"
import { CalendarIcon, ImagePlus } from "lucide-react"
import { format } from "date-fns"

import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { useProtectedRoute } from "@/hooks/use-protected-route"
import { submitReport } from "@/lib/supabase/reports"

const formSchema = z.object({
  type: z.enum(["lost", "found"], {
    required_error: "Please select whether the item was lost or found.",
  }),
  title: z.string().min(3, {
    message: "Item name must be at least 3 characters.",
  }),
  category: z.string({
    required_error: "Please select a category.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  location: z.string().min(3, {
    message: "Location must be at least 3 characters.",
  }),
  date: z.date({
    required_error: "Please select a date.",
  }),
})

export default function ReportItemPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const { isAuthenticated, isLoading } = useProtectedRoute(["user"])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [images, setImages] = useState<File[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "lost",
      title: "",
      category: "",
      description: "",
      location: "",
      date: new Date(),
    },
  })

  // Handle loading state
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // Return null if not authenticated - the hook will handle redirection
  if (!isAuthenticated) {
    return null
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      
      // Validate file types and sizes
      const validFiles = newFiles.filter(file => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
        
        if (!isValidType) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not an image file.`,
            variant: "destructive",
          });
        }
        
        if (!isValidSize) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds the 5MB size limit.`,
            variant: "destructive",
          });
        }
        
        return isValidType && isValidSize;
      });
      
      setImages((prev) => [...prev, ...validFiles].slice(0, 3)) // Limit to 3 images
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to submit a report.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Log images being submitted
      if (images.length > 0) {
        console.log(`Submitting ${images.length} images:`, images.map(img => ({
          name: img.name,
          type: img.type,
          size: Math.round(img.size / 1024) + 'KB'
        })));
      }

      const success = await submitReport(
        {
          ...values,
          images: images.length > 0 ? images : undefined,
        },
        user.id
      )

      if (success) {
        toast({
          title: "Report submitted",
          description: `Your ${values.type} item report has been submitted successfully.`,
        })

        // Reset form
        form.reset()
        setImages([])
        
        // Redirect to dashboard
        router.push("/dashboard/user")
      } else {
        throw new Error("Failed to submit report")
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Submission failed",
        description: error instanceof Error 
          ? `Error: ${error.message}`
          : "There was an error submitting your report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout role="user">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Report an Item</CardTitle>
            <CardDescription>Fill out the form below to report a lost or found item.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select report type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lost">Lost Item</SelectItem>
                          <SelectItem value="found">Found Item</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Black Laptop Bag" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="electronics">Electronics</SelectItem>
                            <SelectItem value="clothing">Clothing</SelectItem>
                            <SelectItem value="accessories">Accessories</SelectItem>
                            <SelectItem value="documents">Documents</SelectItem>
                            <SelectItem value="keys">Keys</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed description of the item..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Include details like color, brand, distinguishing features, etc.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Engineering Building A, Room 201" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date {form.watch("type") === "lost" ? "Lost" : "Found"}</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className="w-full pl-3 text-left font-normal">
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormItem>
                  <FormLabel>Images (Optional)</FormLabel>
                  <FormControl>
                    <div className="grid gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => document.getElementById("image-upload")?.click()}
                          disabled={images.length >= 3}
                        >
                          <ImagePlus className="mr-2 h-4 w-4" />
                          {images.length === 0 ? "Upload Images" : "Add More Images"}
                        </Button>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageChange}
                          disabled={images.length >= 3}
                        />
                      </div>
                      {images.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                          {images.map((image, index) => (
                            <div key={index} className="relative">
                              <img
                                src={URL.createObjectURL(image)}
                                alt={`Uploaded ${index + 1}`}
                                className="h-32 w-full rounded-md object-cover"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0"
                                onClick={() => removeImage(index)}
                              >
                                &times;
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <FormDescription>Upload up to 3 images of the item. Accepted formats: JPG, PNG.</FormDescription>
                    </div>
                  </FormControl>
                </FormItem>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => router.push("/dashboard/user")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 