
"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface RevenueByConceptChartProps {
    data: { name: string; total: number }[];
}

export function RevenueByConceptChart({ data }: RevenueByConceptChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-80 text-muted-foreground">
                No hay datos de ingresos para mostrar.
            </div>
        );
    }
    
    return (
        <ResponsiveContainer width="100%" height={300}>
            <ChartContainer config={{}} className="h-full w-full">
                <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(value) => `S/ ${value}`} />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={120}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        content={<ChartTooltipContent
                            formatter={(value) => `S/ ${Number(value).toFixed(2)}`}
                            labelClassName="font-bold"
                            className="bg-background shadow-lg"
                        />}
                    />
                    <Bar 
                        dataKey="total" 
                        name="Ingresos" 
                        fill="hsl(var(--primary))" 
                        radius={[0, 4, 4, 0]} 
                    />
                </BarChart>
            </ChartContainer>
        </ResponsiveContainer>
    );
}
