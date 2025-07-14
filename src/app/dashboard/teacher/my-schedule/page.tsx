
"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getTeachers, getUnitAssignments, getStudyPrograms } from '@/config/firebase';
import type { Teacher, UnitAssignment, StudyProgram } from '@/types';
import { TeacherScheduleView } from '@/components/teachers/TeacherScheduleView';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MySchedulePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [assignments, setAssignments] = useState<UnitAssignment[]>([]);
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'Teacher')) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && user && user.role === 'Teacher') {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          if (!user.dni) {
            throw new Error("Por favor, actualiza tu perfil con tu número de DNI para ver tu carga horaria.");
          }

          const [allTeachers, programs] = await Promise.all([
            getTeachers(),
            getStudyPrograms()
          ]);
          setStudyPrograms(programs);
          
          const currentTeacher = allTeachers.find(t => t.dni === user.dni);
          if (!currentTeacher) {
            throw new Error("No se encontró un registro de docente asociado a tu DNI. Contacta a un administrador.");
          }
          setTeacher(currentTeacher);

          const currentYear = new Date().getFullYear();
          const allAssignments = await getUnitAssignments(currentYear);
          const teacherAssignments = allAssignments.filter(a => a.teacherId === currentTeacher.id);
          setAssignments(teacherAssignments);

        } catch (e: any) {
          console.error("Error fetching schedule data:", e);
          setError(e.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user, authLoading]);

  const programAbbrMap = useMemo(() => new Map(studyPrograms.map(p => [p.name, p.abbreviation || ''])), [studyPrograms]);

  if (authLoading || loading) {
    return (
        <div>
            <Skeleton className="h-12 w-1/2 mb-4" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mi Carga Horaria - {new Date().getFullYear()}</CardTitle>
        <CardDescription>
          Aquí puedes ver un resumen de tus unidades didácticas asignadas para el año actual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : teacher ? (
          <TeacherScheduleView 
            teacher={teacher}
            assignments={assignments}
            programAbbrMap={programAbbrMap}
          />
        ) : (
          <p className="text-muted-foreground text-center">No se encontraron datos.</p>
        )}
      </CardContent>
    </Card>
  );
}
