

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStudyPrograms, getTeachers, getUnitAssignments } from "@/config/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { StudyProgram, Teacher, UnitAssignment } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { TeacherReportCard } from "@/components/reports/TeacherReportCard";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import "./print.css";

interface ProcessedTeacherData {
  teacher: Teacher;
  assignmentsMarJul: UnitAssignment[];
  assignmentsAgosDic: UnitAssignment[];
  totalHoursMarJul: number;
  totalHoursAgosDic: number;
}

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);

  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  
  const [reportData, setReportData] = useState<ProcessedTeacherData[]>([]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (currentYear + 2 - i).toString());
  }, []);

  const programAbbrMap = useMemo(() => new Map(studyPrograms.map(p => [p.name, p.abbreviation || ''])), [studyPrograms]);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'Admin' && user.role !== 'Coordinator'))) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchPrograms = async () => {
      setProgramsLoading(true);
      try {
        const programs = await getStudyPrograms();
        setStudyPrograms(programs);
        if (programs.length > 0) {
            setSelectedProgram(programs[0].name);
        }
      } catch (error) {
        console.error("Failed to fetch study programs:", error);
      } finally {
        setProgramsLoading(false);
      }
    };
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (!selectedYear || !selectedProgram) {
      setReportData([]);
      return;
    };

    const generateReport = async () => {
      setReportLoading(true);
      try {
        const [allTeachers, allAssignmentsForYear] = await Promise.all([
          getTeachers(),
          getUnitAssignments(parseInt(selectedYear)) // Fetch all assignments for the year
        ]);

        // Filter teachers to display based on the selected program
        const teachersInProgram = allTeachers.filter(t => t.studyProgram === selectedProgram);
        
        // For each teacher, find all their assignments from the complete yearly list
        const processedData = teachersInProgram.map(teacher => {
          const teacherAssignments = allAssignmentsForYear.filter(a => a.teacherId === teacher.id);
          
          const assignmentsMarJul = teacherAssignments.filter(a => a.period === 'MAR-JUL');
          const assignmentsAgosDic = teacherAssignments.filter(a => a.period === 'AGOS-DIC');

          const totalHoursMarJul = assignmentsMarJul.reduce((sum, a) => sum + (a.totalHours || 0), 0);
          const totalHoursAgosDic = assignmentsAgosDic.reduce((sum, a) => sum + (a.totalHours || 0), 0);

          return { teacher, assignmentsMarJul, assignmentsAgosDic, totalHoursMarJul, totalHoursAgosDic };
        });

        setReportData(processedData);

      } catch (error) {
        console.error("Failed to generate report:", error);
      } finally {
        setReportLoading(false);
      }
    };

    generateReport();
  }, [selectedYear, selectedProgram]);


  if (authLoading || !user || (user.role !== 'Admin' && user.role !== 'Coordinator')) {
    return <p>Cargando o no autorizado...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="report-header">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Reporte de Carga Horaria por Docente</CardTitle>
              <CardDescription>
                Seleccione el año y el programa de estudios para generar el reporte.
              </CardDescription>
            </div>
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Reporte
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un Año" />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={selectedProgram} onValueChange={setSelectedProgram} disabled={programsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={programsLoading ? "Cargando..." : "Seleccione un Programa"} />
              </SelectTrigger>
              <SelectContent>
                {studyPrograms.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {reportLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
            </div>
          ) : reportData.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 print-grid">
              {reportData.map(data => (
                <TeacherReportCard 
                  key={data.teacher.id}
                  teacher={data.teacher}
                  assignmentsMarJul={data.assignmentsMarJul}
                  assignmentsAgosDic={data.assignmentsAgosDic}
                  totalHoursMarJul={data.totalHoursMarJul}
                  totalHoursAgosDic={data.totalHoursAgosDic}
                  programAbbrMap={programAbbrMap}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>No se encontraron datos de asignación para los filtros seleccionados.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
