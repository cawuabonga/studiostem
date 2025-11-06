"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Save } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { saveAcademicPeriods, getAcademicPeriods } from '@/config/firebase';
import type { AcademicYearSettings, AcademicPeriodSettings, UnitPeriod } from '@/types';
import { Timestamp } from 'firebase/firestore';

const periodSchema = z.object({
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
}).refine(data => !data.startDate || !data.endDate || data.endDate > data.startDate, {
  message: "La fecha de fin debe ser posterior a la de inicio.",
  path: ["endDate"],
});

const formSchema = z.object({
  "MAR-JUL": periodSchema,
  "AGO-DIC": periodSchema,
});

type FormValues = z.infer<typeof formSchema>;

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());

export default function AcademicPeriodsPage() {
    const { instituteId } = useAuth();
    const { toast } = useToast();
    const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            "MAR-JUL": { startDate: null, endDate: null },
            "AGO-DIC": { startDate: null, endDate: null },
        }
    });

    const fetchPeriods = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const data = await getAcademicPeriods(instituteId, selectedYear);
            if (data) {
                const formValues: FormValues = { "MAR-JUL": { startDate: null, endDate: null }, "AGO-DIC": { startDate: null, endDate: null } };
                if (data['MAR-JUL']?.startDate) formValues['MAR-JUL'].startDate = data['MAR-JUL'].startDate.toDate();
                if (data['MAR-JUL']?.endDate) formValues['MAR-JUL'].endDate = data['MAR-JUL'].endDate.toDate();
                if (data['AGO-DIC']?.startDate) formValues['AGO-DIC'].startDate = data['AGO-DIC'].startDate.toDate();
                if (data['AGO-DIC']?.endDate) formValues['AGO-DIC'].endDate = data['AGO-DIC'].endDate.toDate();
                form.reset(formValues);
            } else {
                 form.reset({ "MAR-JUL": { startDate: null, endDate: null }, "AGO-DIC": { startDate: null, endDate: null } });
            }
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los períodos existentes.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, selectedYear, form, toast]);

    useEffect(() => {
        fetchPeriods();
    }, [fetchPeriods]);

    const onSubmit = async (data: FormValues) => {
        if (!instituteId) return;
        setIsSaving(true);
        try {
            const dataToSave: AcademicYearSettings = {};
            if(data['MAR-JUL'].startDate && data['MAR-JUL'].endDate) {
                dataToSave['MAR-JUL'] = {
                    startDate: Timestamp.fromDate(data['MAR-JUL'].startDate),
                    endDate: Timestamp.fromDate(data['MAR-JUL'].endDate),
                };
            }
            if(data['AGO-DIC'].startDate && data['AGO-DIC'].endDate) {
                dataToSave['AGO-DIC'] = {
                    startDate: Timestamp.fromDate(data['AGO-DIC'].startDate),
                    endDate: Timestamp.fromDate(data['AGO-DIC'].endDate),
                };
            }
            
            await saveAcademicPeriods(instituteId, selectedYear, dataToSave);
            toast({ title: "Éxito", description: "Se ha guardado la configuración del calendario académico." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive"});
        } finally {
            setIsSaving(false);
        }
    };
    
    const renderPeriodForm = (period: UnitPeriod, title: string) => (
        <Card className="bg-muted/30">
            <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Fecha de Inicio</Label>
                    <Controller
                        control={form.control}
                        name={`${period}.startDate`}
                        render={({ field }) => (
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "PPP") : <span>Seleccionar fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                            </Popover>
                        )}
                    />
                 </div>
                  <div className="space-y-2">
                    <Label>Fecha de Fin</Label>
                     <Controller
                        control={form.control}
                        name={`${period}.endDate`}
                        render={({ field }) => (
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {field.value ? format(field.value, "PPP") : <span>Seleccionar fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                            </Popover>
                        )}
                    />
                    {form.formState.errors[period]?.endDate && <p className="text-sm font-medium text-destructive">{form.formState.errors[period]?.endDate?.message}</p>}
                 </div>
            </CardContent>
        </Card>
    );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <CardTitle>Configurar Períodos Lectivos</CardTitle>
                <CardDescription>
                Define las fechas de inicio y fin para los semestres académicos de un año específico.
                </CardDescription>
            </div>
             <div className="w-full sm:w-48 space-y-2">
                <Label htmlFor="year-select">Seleccionar Año</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger id="year-select">
                        <SelectValue placeholder="Seleccione un año" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {renderPeriodForm("MAR-JUL", "Período I: Marzo - Julio")}
            {renderPeriodForm("AGO-DIC", "Período II: Agosto - Diciembre")}

            <Button type="submit" disabled={isSaving || loading}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                Guardar Configuración para el {selectedYear}
            </Button>
        </form>
      </CardContent>
    </Card>
  );
}
