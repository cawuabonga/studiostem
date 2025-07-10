
"use client";

import { AssignmentContainer } from "@/components/assignments/AssignmentContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStudyPrograms } from "@/config/firebase";
import { useAuth } from "@/contexts/AuthContext";
import type { StudyProgram } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function AssignUnitsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedProgram, setSelectedProgram] = useState<string>('');

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (currentYear + 2 - i).toString());
  }, []);

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'Admin' && user.role !== 'Coordinator'))) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);
  
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

  if (loading || !user || (user.role !== 'Admin' && user.role !== 'Coordinator')) {
    return <p>Cargando o no autorizado...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Asignación de Unidades Didácticas a Docentes</CardTitle>
          <CardDescription>
            Seleccione el año y el programa de estudios para gestionar las asignaciones.
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
          {selectedYear && selectedProgram ? (
            <AssignmentContainer 
              year={parseInt(selectedYear)} 
              studyProgram={selectedProgram} 
            />
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>Por favor, seleccione un año y un programa de estudios para comenzar.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
