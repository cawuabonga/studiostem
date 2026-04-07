
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getPrograms } from '@/config/firebase';
import type { Program, UnitTurno } from '@/types';
import { Input } from '@/components/ui/input';
import { Loader2, CalendarRange } from 'lucide-react';
import { ScheduleGenerator } from '@/components/planning/ScheduleGenerator';

const semesters = Array.from({ length: 10 }, (_, i) => i + 1);
const turnos: UnitTurno[] = ['Mañana', 'Tarde', 'Noche'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => (currentYear - 2 + i).toString());


export default function GeneradorHorariosPage() {
    const { user, hasPermission, instituteId } = useAuth();
    
    const isFullAdmin = hasPermission('academic:program:manage');
    const isCoordinator = !!user?.programId && !isFullAdmin;

    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedProgramId, setSelectedProgramId] = useState<string>('');
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedSemester, setSelectedSemester] = useState<string>('');
    const [selectedTurno, setSelectedTurno] = useState<UnitTurno | ''>('');

    const [scheduleParams, setScheduleParams] = useState<{programId: string; year: string; semester: number; turno: UnitTurno} | null>(null);


    useEffect(() => {
        if (instituteId) {
            setLoading(true);
            getPrograms(instituteId).then(allPrograms => {
                if (isCoordinator && user?.programId) {
                    const myPrograms = allPrograms.filter(p => p.id === user.programId);
                    setPrograms(myPrograms);
                    if (myPrograms.length > 0) {
                        setSelectedProgramId(myPrograms[0].id);
                    }
                } else {
                    setPrograms(allPrograms);
                }
                setLoading(false);
            });
        }
    }, [instituteId, isCoordinator, user?.programId]);


    const handleShowGenerator = () => {
        if (selectedProgramId && selectedYear && selectedSemester && selectedTurno) {
            setScheduleParams({
                programId: selectedProgramId,
                year: selectedYear,
                semester: parseInt(selectedSemester, 10),
                turno: selectedTurno as UnitTurno
            });
        }
    };
    
    const coordinatorProgramName = isCoordinator ? programs.find(p => p.id === user?.programId)?.name : '';

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <CalendarRange className="h-8 w-8 text-primary" />
                        <div>
                            <CardTitle>Generador de Horarios por Sección</CardTitle>
                            <CardDescription>
                                Crea horarios independientes por programa, ciclo y turno. El sistema validará conflictos de docentes y aulas en todo el instituto.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     {loading ? <Loader2 className="animate-spin" /> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="program-select">Programa de Estudios</Label>
                                {isCoordinator ? (
                                    <Input value={coordinatorProgramName || 'Cargando...'} disabled />
                                ) : (
                                    <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                                        <SelectTrigger id="program-select">
                                            <SelectValue placeholder="Seleccione un programa" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {programs.map(program => <SelectItem key={program.id} value={program.id}>{program.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="year-select">Año Académico</Label>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger id="year-select"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="semester-select">Semestre</Label>
                                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                                    <SelectTrigger id="semester-select"><SelectValue placeholder="Ciclo..." /></SelectTrigger>
                                    <SelectContent>
                                        {semesters.map(s => <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="turno-select">Turno / Sección</Label>
                                <Select value={selectedTurno} onValueChange={(v) => setSelectedTurno(v as UnitTurno)}>
                                    <SelectTrigger id="turno-select"><SelectValue placeholder="Seleccione turno..." /></SelectTrigger>
                                    <SelectContent>
                                        {turnos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleShowGenerator} disabled={!selectedProgramId || !selectedYear || !selectedSemester || !selectedTurno}>
                                Cargar Generador
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {scheduleParams && (
                <ScheduleGenerator
                    key={`${scheduleParams.programId}-${scheduleParams.year}-${scheduleParams.semester}-${scheduleParams.turno}`}
                    {...scheduleParams}
                />
            )}
        </div>
    );
}
