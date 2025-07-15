
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getTeachers } from '@/config/firebase';
import type { Teacher } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { EditTeacherDialog } from './EditTeacherDialog';
import { DeleteTeacherDialog } from './DeleteTeacherDialog';
import { Input } from '../ui/input';
import { useAuth } from '@/contexts/AuthContext';

interface TeachersListProps {
  onDataChange: () => void;
}

export function TeachersList({ onDataChange }: TeachersListProps) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { instituteId } = useAuth();
  const itemsPerPage = 10;

  const fetchTeachers = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const fetchedTeachers = await getTeachers(instituteId);
      setTeachers(fetchedTeachers);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los docentes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, instituteId]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteDialogOpen(true);
  };

  const handleDialogClose = (updated?: boolean) => {
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedTeacher(null);
    if (updated) {
      fetchTeachers();
      onDataChange();
    }
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher =>
      teacher.fullName.toLowerCase().includes(filter.toLowerCase()) ||
      teacher.dni.includes(filter)
    );
  }, [teachers, filter]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Pagination logic
  const lastItemIndex = currentPage * itemsPerPage;
  const firstItemIndex = lastItemIndex - itemsPerPage;
  const currentItems = filteredTeachers.slice(firstItemIndex, lastItemIndex);
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);


  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-1/3 mb-4" />
        {[...Array(itemsPerPage)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <Input
          placeholder="Buscar por nombre o DNI..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border relative">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DNI</TableHead>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Condición</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.length > 0 ? (
              currentItems.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-mono">{teacher.dni}</TableCell>
                  <TableCell className="font-medium">{teacher.fullName}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{teacher.condition}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(teacher)}>
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Editar Docente</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(teacher)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar Docente</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No se encontraron docentes.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

       <div className="flex items-center justify-between pt-4">
        <div className="text-sm text-muted-foreground">
          Mostrando {Math.min(firstItemIndex + 1, filteredTeachers.length)} a {Math.min(lastItemIndex, filteredTeachers.length)} de {filteredTeachers.length} docentes.
        </div>
        <div className="flex items-center space-x-2">
           <span className="text-sm text-muted-foreground">
             Página {currentPage} de {totalPages > 0 ? totalPages : 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage >= totalPages}
          >
            Siguiente
          </Button>
        </div>
      </div>
      {selectedTeacher && isEditDialogOpen && (
        <EditTeacherDialog
          teacher={selectedTeacher}
          isOpen={isEditDialogOpen}
          onClose={handleDialogClose}
        />
      )}
      {selectedTeacher && isDeleteDialogOpen && (
          <DeleteTeacherDialog
            teacher={selectedTeacher}
            isOpen={isDeleteDialogOpen}
            onClose={handleDialogClose}
          />
      )}
    </>
  );
}
