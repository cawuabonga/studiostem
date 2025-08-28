
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getStaffProfiles, getPrograms } from '@/config/firebase';
import type { Teacher, Program, StaffProfile } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, MoreHorizontal, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { EditTeacherDialog } from './EditTeacherDialog';
import { DeleteTeacherDialog } from './DeleteTeacherDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '../ui/input';
import Link from 'next/link';

interface TeachersListProps {
    instituteId: string;
    onDataChange: () => void;
}

const PAGE_SIZE = 10;

export function TeachersList({ instituteId, onDataChange }: TeachersListProps) {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [programs, setPrograms] = useState<Map<string, Program>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const fetchStaffAndPrograms = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [fetchedStaff, fetchedPrograms] = await Promise.all([
        getStaffProfiles(id),
        getPrograms(id),
      ]);
      setStaff(fetchedStaff);
      setPrograms(new Map(fetchedPrograms.map(p => [p.id, p])));
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los perfiles de personal.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (instituteId) {
      fetchStaffAndPrograms(instituteId);
    }
  }, [instituteId, fetchStaffAndPrograms]);
  
  const handleDialogClose = (updated?: boolean) => {
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedTeacher(null);
    if (updated && instituteId) {
      fetchStaffAndPrograms(instituteId);
      onDataChange();
    }
  };

  const teachers = useMemo(() => {
    return staff
      .filter(s => s.role === 'Teacher' || s.role === 'Coordinator')
      .map(s => ({
            id: s.documentId,
            documentId: s.documentId,
            fullName: s.displayName,
            email: s.email,
            phone: s.phone || '',
            specialty: 'N/A', 
            active: !!s.linkedUserUid,
            condition: s.condition,
            programId: s.programId,
            programName: programs.get(s.programId)?.name || 'N/A'
      } as Teacher));
  }, [staff, programs]);

  const filteredTeachers = useMemo(() => 
    teachers.filter(teacher => 
        teacher.fullName.toLowerCase().includes(filter.toLowerCase()) ||
        teacher.documentId.toLowerCase().includes(filter.toLowerCase()) ||
        teacher.email.toLowerCase().includes(filter.toLowerCase())
    ), [teachers, filter]);
  
  const paginatedTeachers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredTeachers.slice(start, end);
  }, [filteredTeachers, currentPage]);

  const totalPages = Math.ceil(filteredTeachers.length / PAGE_SIZE);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-1/3 mb-2" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  
  if (!teachers.length) {
    return <p className="text-center text-muted-foreground">No hay docentes o coordinadores registrados.</p>;
  }

  return (
    <>
      <div className="mb-4">
        <Input 
          placeholder="Buscar por nombre, documento o email..."
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>N° Documento</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Programa</TableHead>
              <TableHead>Condición</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTeachers.map((teacher) => (
              <TableRow key={teacher.documentId}>
                <TableCell className="font-medium">{teacher.fullName}</TableCell>
                <TableCell>{teacher.documentId}</TableCell>
                <TableCell>{teacher.email}</TableCell>
                <TableCell>{teacher.programName || 'N/A'}</TableCell>
                <TableCell><Badge variant="outline">{teacher.condition || 'N/A'}</Badge></TableCell>
                <TableCell>
                  <Badge variant={teacher.active ? 'default' : 'secondary'}>
                    {teacher.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/profile/${teacher.documentId}`} target="_blank">
                        <Eye className="mr-2 h-4 w-4"/>
                        Perfil Público
                      </Link>
                    </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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

      {selectedTeacher && isEditDialogOpen && (
        <EditTeacherDialog 
          teacher={selectedTeacher}
          instituteId={instituteId}
          isOpen={isEditDialogOpen}
          onClose={handleDialogClose}
        />
      )}
       {selectedTeacher && isDeleteDialogOpen && (
        <DeleteTeacherDialog 
          teacher={selectedTeacher}
          instituteId={instituteId}
          isOpen={isDeleteDialogOpen}
          onClose={handleDialogClose}
        />
       )}
    </>
  );
}
