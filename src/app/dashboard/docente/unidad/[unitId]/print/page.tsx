
"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import type { Unit, Syllabus, WeekData, AchievementIndicator, Program, Teacher, SyllabusDesignOptions } from '@/types';
import { getUnit, getSyllabus, getWeekData, getAchievementIndicators, getPrograms, getTeachers, getAssignments } from '@/config/firebase';
import { useToast } from '@/hooks/use-toast';
import { usePathname, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { SyllabusPrintLayout } from '@/components/syllabus/SyllabusPrintLayout';
import '@/app/dashboard/gestion-academica/print-grades.css';

function PrintSyllabusContent() {
    const { instituteId, institute } = useAuth();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    const pathSegments = pathname.split('/');
    const unitId = pathSegments[pathSegments.length - 2] || '';

    const [loading, setLoading] = useState(true);
    const [printableData, setPrintableData] = useState<{
        unit: Unit;
        program: Program | null;
        teacher: Teacher | null;
        syllabus: Syllabus | null;
        weeklyData: WeekData[];
        indicators: AchievementIndicator[];
    } | null>(null);

    const designOptions: SyllabusDesignOptions = {
        showLogo: searchParams.get('showLogo') !== 'false',
        showInfoTable: searchParams.get('showInfoTable') !== 'false',
        showSignature: searchParams.get('showSignature') !== 'false',
    };

    const fetchDataForPrint = useCallback(async () => {
        if (!instituteId || !unitId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const currentYear = new Date().getFullYear().toString();
            const unit = await getUnit(instituteId, unitId);
            if (!unit) {
                toast({ title: "Error", description: "Unidad no encontrada.", variant: "destructive" });
                setLoading(false);
                return;
            }

            const weekPromises = Array.from({ length: unit.totalWeeks }, (_, i) => getWeekData(instituteId, unit.id, i + 1));
            const [
                allPrograms,
                allTeachers,
                syllabus,
                weeklyResults,
                indicators,
            ] = await Promise.all([
                getPrograms(instituteId),
                getTeachers(instituteId),
                getSyllabus(instituteId, unit.id),
                Promise.all(weekPromises),
                getAchievementIndicators(instituteId, unit.id)
            ]);

            const program = allPrograms.find(p => p.id === unit.programId) || null;
            const assignments = await getAssignments(instituteId, currentYear, unit.programId);
            const teacherId = assignments[unit.period]?.[unit.id];
            const teacher = allTeachers.find(t => t.documentId === teacherId) || null;
            
            const weeklyData = weeklyResults.map((data, index) => data || { weekNumber: index + 1, contents: [], tasks: [], capacityElement: '', learningActivities: '', basicContents: '', isVisible: false });

            setPrintableData({ unit, program, teacher, syllabus, weeklyData, indicators });

             setTimeout(() => {
                window.print();
            }, 500);

        } catch (error) {
            console.error("Error preparing print data:", error);
            toast({ title: "Error", description: "No se pudieron cargar los datos para la impresión.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, unitId, toast]);

    useEffect(() => {
        fetchDataForPrint();
    }, [fetchDataForPrint]);


    if (loading) {
        return (
            <div className="p-8 space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }
    
    if (!printableData) {
        return <p className="p-8">No se encontraron datos para imprimir.</p>;
    }

    return (
        <div className="bg-white text-black p-4">
            <SyllabusPrintLayout
                institute={institute}
                {...printableData}
                designOptions={designOptions}
            />
        </div>
    );
}


export default function PrintSyllabusPage() {
    return (
        <Suspense fallback={<p>Cargando...</p>}>
            <PrintSyllabusContent />
        </Suspense>
    )
}
