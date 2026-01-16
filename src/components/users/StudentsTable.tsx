
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getStudentProfiles, getPrograms } from '@/config/firebase';
import type { StudentProfile, Program } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, ArrowRight, Edit2, Eye, KeyRound } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import Image from 'next/image';
import Link from 'next/link';
import { EditStudentProfileDialog } from './EditStudentProfileDialog';
import { useAuth } from '@/contexts/AuthContext';

interface StudentsTableProps {
    instituteId: string;
    onDataChange: () => void;
    isMatriculaMode?: boolean;
}

const PAGE_SIZE = 10;
const semesters = Array.from({ length: 10 }, (_, i) => i + 1);

const calculateCurrentSemester = (admissionYear: string, admissionPeriod: 'MAR-JUL' | 'AGO-DIC'): number => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // 0-11
    
    const yearsDiff = currentYear - parseInt(admissionYear);
    let semesterCount = yearsDiff * 2;

    if (admissionPeriod === 'MAR-JUL') {
        semesterCount += 1;
    }

    if (currentMonth >= 7) { // July onwards, we are in the second semester of the year
        semesterCount += 1;
    } else if (admissionPeriod === 'AGO-DIC') {
         semesterCount -=1;
    }

    return Math.max(1, semesterCount);
};


export function StudentsTable({ instituteId, onDataChange, isMatriculaMode = false }: StudentsTableProps) {
  const [allProfiles, setAllProfiles] = useState<StudentProfile[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [textFilter, setTextFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();
  
  const isFullAdmin = hasPermission('academic:program:manage');
  const isCoordinator = hasPermission('academic:enrollment:manage') && !isFullAdmin;

  const [selectedProfile, setSelectedProfile] = useState<StudentProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const fetchData = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [fetchedProfiles, fetchedPrograms] = await Promise.all([
        getStudentProfiles(id),
        getPrograms(id),
      ]);
      setAllProfiles(fetchedProfiles);
      setPrograms(fetchedPrograms);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los perfiles de los estudiantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (instituteId) {
      fetchData(instituteId);
      if (isCoordinator && user?.programId) {
        setProgramFilter(user.programId);
      }
    }
  }, [instituteId, fetchData, isCoordinator, user?.programId]);

  const handleDialogClose = (updated?: boolean) => {
    setIsEditDialogOpen(false);
    setSelectedProfile(null);
    if (updated) {
        fetchData(instituteId);
    }
  };

  const filteredProfiles = useMemo(() => {
    let profiles = allProfiles;

    if (programFilter !== 'all') {
        profiles = profiles.filter(p => p.programId === programFilter);
    }

    if (semesterFilter !== 'all') {
        profiles = profiles.filter(p => {
            const studentSemester = calculateCurrentSemester(p.admissionYear, p.admissionPeriod);
            return studentSemester === parseInt(semesterFilter);
        });
    }

    if (textFilter) {
        profiles = profiles.filter(profile =>
            profile.fullName.toLowerCase().includes(textFilter.toLowerCase()) ||
            profile.documentId.toLowerCase().includes(textFilter.toLowerCase()) ||
            profile.email.toLowerCase().includes(textFilter.toLowerCase())
        );
    }

    return profiles.sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [allProfiles, textFilter, programFilter, semesterFilter]);
  
  const paginatedProfiles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredProfiles.slice(start, end);
  }, [filteredProfiles, currentPage]);

  const totalPages = Math.ceil(filteredProfiles.length / PAGE_SIZE);
  
  const programMap = useMemo(() => new Map(programs.map(p => [p.id, p])), [programs]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full mb-2" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  
  if (!allProfiles.length) {
    return <p className="text-center text-muted-foreground py-8">No hay perfiles de estudiantes registrados.</p>;
  }

  const coordinatorProgramName = isCoordinator ? programMap.get(user?.programId || '')?.name : '';


  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Input 
          placeholder="Buscar por nombre, documento o email..."
          value={textFilter}
          onChange={(e) => {
            setTextFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-sm"
        />
         {isCoordinator ? (
            <Input value={coordinatorProgramName || 'Cargando...'} disabled />
         ) : (
            <Select value={programFilter} onValueChange={(value) => {setProgramFilter(value); setCurrentPage(1);}}>
                <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder="Filtrar por programa" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos los Programas</SelectItem>
                    {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
            </Select>
         )}
        <Select value={semesterFilter} onValueChange={(value) => {setSemesterFilter(value); setCurrentPage(1);}}>
            <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por semestre" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los Semestres</SelectItem>
                {semesters.map(s => <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>)}
            </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Foto</TableHead>
              <TableHead>N° Documento</TableHead>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Programa</TableHead>
              <TableHead>ID Tarjeta</TableHead>
              <TableHead>Vinculado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProfiles.length > 0 ? paginatedProfiles.map((profile) => (
              <TableRow key={profile.id || profile.documentId}>
                <TableCell>
                   <Image 
                      src={profile.photoURL || `https://placehold.co/40x40.png?text=${profile.fullName[0]}`} 
                      alt={`Foto de ${profile.fullName}`}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                      data-ai-hint="student photo"
                   />
                </TableCell>
                <TableCell className="font-mono">{profile.documentId}</TableCell>
                <TableCell className="font-medium">{profile.fullName}</TableCell>
                <TableCell>{programMap.get(profile.programId)?.name || 'N/A'}</TableCell>
                <TableCell>
                  {profile.rfidCardId ? (
                    <Badge variant="secondary"><KeyRound className="mr-2 h-3 w-3"/>{profile.rfidCardId}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin Asignar</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={profile.linkedUserUid ? 'default' : 'secondary'}>
                    {profile.linkedUserUid ? 'Sí' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                    {isMatriculaMode ? (
                        <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/gestion-academica/matricula/${profile.documentId}`}>
                                Matricular <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    ) : (
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link href={`/profile/${profile.documentId}`} target="_blank">
                                        <Eye className="mr-2 h-4 w-4" /> Ver Perfil Público
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setSelectedProfile(profile); setIsEditDialogOpen(true); }}>
                                    <Edit2 className="mr-2 h-4 w-4" /> Editar Perfil
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                        No se encontraron estudiantes con los filtros actuales.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
         <div className="flex items-center justify-end space-x-2 py-4">
            <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            >
            Anterior
            </Button>
            <span className="text-sm">
                Página {currentPage} de {totalPages}
            </span>
            <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            >
            Siguiente
            </Button>
        </div>
      )}
       {selectedProfile && isEditDialogOpen && (
        <EditStudentProfileDialog
            profile={selectedProfile}
            isOpen={isEditDialogOpen}
            onClose={handleDialogClose}
            instituteId={instituteId}
        />
      )}
    </>
  );
}
