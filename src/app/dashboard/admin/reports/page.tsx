
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

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'Admin')) {
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
        const [allTeachers, allAssignments] = await Promise.all([
          getTeachers(),
          getUnitAssignments(parseInt(selectedYear), selectedProgram)
        ]);

        const teachersInProgram = allTeachers.filter(t => t.studyProgram === selectedProgram);
        
        const processedData = teachersInProgram.map(teacher => {
          const teacherAssignments = allAssignments.filter(a => a.teacherId === teacher.id);
          
          const assignmentsMarJul = teacherAssignments.filter(a => a.period === 'MAR-JUL');
          const assignmentsAgosDic = teacherAssignments.filter(a => a.period === 'AGOS-DIC');

          const totalHoursMarJul = assignmentsMarJul.reduce((sum, a) => sum + a.totalHours, 0);
          const totalHoursAgosDic = assignmentsAgosDic.reduce((sum, a) => sum + a.totalHours, 0);

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


  if (authLoading || !user || user.role !== 'Admin') {
    return <p>Cargando o no autorizado...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reporte de Carga Horaria por Docente</CardTitle>
          <CardDescription>
            Seleccione el año y el programa de estudios para generar el reporte.
          </CardDescription>
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
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {reportData.map(data => (
                <TeacherReportCard 
                  key={data.teacher.id}
                  teacher={data.teacher}
                  assignmentsMarJul={data.assignmentsMarJul}
                  assignmentsAgosDic={data.assignmentsAgosDic}
                  totalHoursMarJul={data.totalHoursMarJul}
                  totalHoursAgosDic={data.totalHoursAgosDic}
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
