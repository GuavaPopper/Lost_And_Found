"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Monitor, Smartphone, CheckCircle, TrendingUp } from "lucide-react"
import { MonthlyStats } from "@/lib/supabase/admin"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AdminDashboardChartProps {
  data: MonthlyStats[]
  isLoading: boolean
  title?: string
  description?: string
}

export function AdminDashboardChart({
  data,
  isLoading,
  title = "System Overview",
  description = "Monthly report statistics"
}: AdminDashboardChartProps) {
  
  const chartConfig = {
    lost: {
      label: "Lost Items",
      color: "hsl(var(--chart-2))",
      icon: Monitor
    },
    found: {
      label: "Found Items",
      color: "hsl(var(--chart-1))",
      icon: Smartphone
    },
    returned: {
      label: "Returned Items",
      color: "hsl(var(--chart-3))",
      icon: CheckCircle
    }
  }

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="h-[calc(100%-5rem)]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground">Loading chart data...</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                axisLine={{ stroke: 'hsl(var(--muted-foreground))' }} 
                tickLine={false}
              />
              <YAxis 
                allowDecimals={false} 
                tick={{ fontSize: 12 }} 
                axisLine={{ stroke: 'hsl(var(--muted-foreground))' }} 
                tickLine={false}
              />
              <ChartTooltip 
                cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                content={<ChartTooltipContent />} 
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar 
                name="Lost Items" 
                dataKey="lost" 
                fill="var(--color-lost)" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                name="Found Items" 
                dataKey="found" 
                fill="var(--color-found)" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                name="Returned Items" 
                dataKey="returned" 
                fill="var(--color-returned)" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
} 