
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getStudentProfiles, getPrograms, bulkCreateMatriculations, getUnits } from '@/config/firebase';
import type { StudentProfile, Program, Unit } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, ArrowRight, Edit2, Eye, Loader2, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import Image from 'next/image';
import Link from 'next/link';
import { EditStudentProfileDialog } from './EditStudentProfileDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '../ui/label';

interface StudentsTableProps {
    instituteId: string;
    onDataChange: () => void;
    isMatriculaMode?: boolean;
}

const PAGE_SIZE = 10;
const semesters = Array.from({ length: 10 }, (_, i) => i + 1);

const calculateCurrentSemester = (admissionYear: string, admissionPeriod: 'MAR-JUL' | 'AGO-DIC'): number => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); 
    const yearsDiff = currentYear - parseInt(admissionYear);
    let semesterCount = yearsDiff * 2;
    if (admissionPeriod === 'MAR-JUL') semesterCount += 1;
    if (currentMonth >= 7) semesterCount += 1;
    else if (admissionPeriod === 'AGO-DIC') semesterCount -= 1;
    return Math.max(1, semesterCount);
};


export function StudentsTable({ instituteId, onDataChange, isMatriculaMode = false }: StudentsTableProps) {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  
  const [allProfiles, setAllProfiles] = useState<StudentProfile[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [textFilter, setTextFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Edit states
  const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkData, setBulkData] = useState({ year: new Date().getFullYear().toString(), semester: '' });

  const isFullAdmin = hasPermission('superadmin:institute:manage') || (user?.role === 'Admin' && !user?.programId);
  const coordinatorProgramId = user?.programId || (user as any)?.programId;

  const fetchData = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [fetchedProfiles, fetchedPrograms, fetchedUnits] = await Promise.all([
        getStudentProfiles(id),
        getPrograms(id),
        getUnits(id)
      ]);
      setAllProfiles(fetchedProfiles);
      setPrograms(fetchedPrograms);
      setAllUnits(fetchedUnits);
      
      if (!isFullAdmin && coordinatorProgramId) {
          setProgramFilter(coordinatorProgramId);
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [instituteId, isFullAdmin, coordinatorProgramId, toast]);

  useEffect(() => { if (instituteId) fetchData(instituteId); }, [fetchData]);

  const handleDialogClose = (updated?: boolean) => {
    setIsEditDialogOpen(false);
    setSelectedProfile(null);
    if (updated) {
      fetchData(instituteId);
      onDataChange();
    }
  };

  const filteredProfiles = useMemo(() => {
    let profiles = allProfiles;
    if (programFilter !== 'all') profiles = profiles.filter(p => p.programId === programFilter);
    if (semesterFilter !== 'all') {
        profiles = profiles.filter(p => (p.currentSemester || calculateCurrentSemester(p.admissionYear, p.admissionPeriod)) === parseInt(semesterFilter));
    }
    if (textFilter) {
        profiles = profiles.filter(p => 
            p.fullName.toLowerCase().includes(textFilter.toLowerCase()) ||
            p.documentId.includes(textFilter)
        );
    }
    return profiles.sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [allProfiles, textFilter, programFilter, semesterFilter]);
  
  const paginatedProfiles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProfiles.slice(start, start + PAGE_SIZE);
  }, [filteredProfiles, currentPage]);

  const totalPages = Math.ceil(filteredProfiles.length / PAGE_SIZE);
  const programMap = useMemo(() => new Map(programs.map(p => [p.id, p])), [programs]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(filteredProfiles.map(p => p.documentId)));
    else setSelectedIds(new Set());
  };

  const handleSelectOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleBulkMatriculate = async () => {
    if (!instituteId || selectedIds.size === 0 || !bulkData.semester) return;
    setIsSubmitting(true);
    try {
        const semesterNum = parseInt(bulkData.semester);
        const unitsToEnroll = allUnits.filter(u => u.programId === programFilter && u.semester === semesterNum);
        
        if (unitsToEnroll.length === 0) {
            throw new Error("No hay unidades didácticas configuradas para este programa y semestre.");
        }

        await bulkCreateMatriculations(instituteId, Array.from(selectedIds), unitsToEnroll, bulkData.year, semesterNum);
        toast({ title: "Matrícula Exitosa", description: `${selectedIds.size} estudiantes matriculados en ${unitsToEnroll.length} unidades.` });
        setIsBulkDialogOpen(false);
        setSelectedIds(new Set());
        fetchData(instituteId);
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-full" />{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 mb-4 items-end">
        <div className="flex-1 space-y-1">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Búsqueda</Label>
            <Input placeholder="Buscar por nombre o DNI..." value={textFilter} onChange={(e) => setTextFilter(e.target.value)} />
        </div>
        <div className="w-[280px] space-y-1">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Programa de Estudios</Label>
            <Select value={programFilter} onValueChange={setProgramFilter} disabled={!isFullAdmin}>
                <SelectTrigger><SelectValue placeholder="Programa..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos los Programas</SelectItem>
                    {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <div className="w-[180px] space-y-1">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Ciclo Académico</Label>
            <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger><SelectValue placeholder="Semestre..." /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos los Semestres</SelectItem>
                    {semesters.map(s => <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        {isMatriculaMode && selectedIds.size > 0 && (
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsBulkDialogOpen(true)}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Matricular ({selectedIds.size})
            </Button>
        )}
      </div>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {isMatriculaMode && (
                <TableHead className="w-[50px]"><Checkbox checked={selectedIds.size === filteredProfiles.length && filteredProfiles.length > 0} onCheckedChange={handleSelectAll}/></TableHead>
              )}
              <TableHead className="w-[40px] text-center">N°</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Estudiante</TableHead>
              <TableHead>Ciclo Actual</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProfiles.map((p, index) => {
              const currentSem = p.currentSemester || calculateCurrentSemester(p.admissionYear, p.admissionPeriod);
              return (
                <TableRow key={p.documentId}>
                  {isMatriculaMode && (
                    <TableCell><Checkbox checked={selectedIds.has(p.documentId)} onCheckedChange={() => handleSelectOne(p.documentId)}/></TableCell>
                  )}
                  <TableCell className="text-center font-bold text-muted-foreground">{(currentPage - 1) * PAGE_SIZE + index + 1}</TableCell>
                  <TableCell className="font-mono text-xs">{p.documentId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        <Image src={p.photoURL || `https://placehold.co/40x40.png?text=${p.fullName[0]}`} alt="" width={32} height={32} className="rounded-full object-cover" />
                        <span className="font-medium">{p.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">Semestre {currentSem}</Badge></TableCell>
                  <TableCell><Badge variant={p.linkedUserUid ? 'default' : 'secondary'}>{p.linkedUserUid ? 'Vinculado' : 'Pendiente'}</Badge></TableCell>
                  <TableCell className="text-right">
                    {isMatriculaMode ? (
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/gestion-academica/matricula/${p.documentId}`}>Matricular <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                    ) : (
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedProfile(p); setIsEditDialogOpen(true); }}><Edit2 className="h-4 w-4"/></Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <p className="text-xs text-muted-foreground">Total: {filteredProfiles.length} estudiantes</p>
        <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Anterior</Button>
            <span className="text-xs font-medium">Página {currentPage} de {totalPages || 1}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>Siguiente</Button>
        </div>
      </div>

      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Matrícula Masiva ({selectedIds.size} alumnos)</DialogTitle>
                <DialogDescription>Los alumnos seleccionados serán inscritos en todas las unidades didácticas del semestre elegido.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Año</Label><Input value={bulkData.year} disabled /></div>
                    <div className="space-y-2">
                        <Label>Semestre de Destino</Label>
                        <Select value={bulkData.semester} onValueChange={(v) => setBulkData(p => ({ ...p, semester: v }))}>
                            <SelectTrigger><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                            <SelectContent>{semesters.map(s => <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800">
                    Se inscribirán automáticamente en las unidades configuradas para el semestre {bulkData.semester} en el periodo actual.
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsBulkDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleBulkMatriculate} disabled={isSubmitting || !bulkData.semester}>{isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmar Matrícula Masiva"}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {selectedProfile && isEditDialogOpen && (
        <EditStudentProfileDialog profile={selectedProfile} isOpen={isEditDialogOpen} onClose={handleDialogClose} instituteId={instituteId} />
      )}
    </>
  );
}
