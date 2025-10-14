

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getStaffProfiles, getPrograms, getRoles } from '@/config/firebase';
import type { Teacher, Program, StaffProfile, Role } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, MoreHorizontal, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '../ui/input';
import Link from 'next/link';
// Assuming these dialogs are compatible or will be adapted for StaffProfile
import { EditStaffProfileDialog } from '../users/EditStaffProfileDialog';
import { DeleteStaffProfileDialog } from '../users/DeleteStaffProfileDialog';

interface TeachersListProps {
    instituteId: string;
    onDataChange: () => void;
}

const PAGE_SIZE = 10;

export function TeachersList({ instituteId, onDataChange }: TeachersListProps) {
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [programs, setPrograms] = useState<Map<string, Program>>(new Map());
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<StaffProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const { hasPermission } = useAuth();

  const canEdit = hasPermission('users:staff:manage');

  const fetchData = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [fetchedStaff, fetchedPrograms, fetchedRoles] = await Promise.all([
        getStaffProfiles(id),
        getPrograms(id),
        getRoles(id),
      ]);
      setStaff(fetchedStaff);
      setPrograms(new Map(fetchedPrograms.map(p => [p.id, p])));
      setRoles(fetchedRoles);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (instituteId) {
      fetchData(instituteId);
    }
  }, [instituteId, fetchData]);
  
  const handleDialogClose = (updated?: boolean) => {
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedProfile(null);
    if (updated && instituteId) {
      fetchData(instituteId);
      onDataChange();
    }
  };

  const teachersAndCoordinators = useMemo(() => {
    // This logic relies on specific role names. It could be improved by using permissions.
    const targetRoleIds = roles
        .filter(role => role.name.toLowerCase() === 'docente' || role.name.toLowerCase() === 'coordinador')
        .map(role => role.id);

    return staff
      .filter(s => targetRoleIds.includes(s.roleId) || s.role === 'Teacher' || s.role === 'Coordinator')
      .map(s => ({
            ...s,
            id: s.documentId,
            programName: programs.get(s.programId)?.name || 'N/A'
      } as StaffProfile & { programName: string }));
  }, [staff, programs, roles]);

  const filteredData = useMemo(() => 
    teachersAndCoordinators.filter(profile => 
        profile.displayName.toLowerCase().includes(filter.toLowerCase()) ||
        profile.documentId.toLowerCase().includes(filter.toLowerCase()) ||
        profile.email.toLowerCase().includes(filter.toLowerCase())
    ), [teachersAndCoordinators, filter]);
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);

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
  
  if (!teachersAndCoordinators.length) {
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
              <TableHead>Vinculado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((profile) => (
              <TableRow key={profile.documentId}>
                <TableCell className="font-medium">{profile.displayName}</TableCell>
                <TableCell>{profile.documentId}</TableCell>
                <TableCell>{profile.email}</TableCell>
                <TableCell>{profile.programName || 'N/A'}</TableCell>
                <TableCell><Badge variant="outline">{profile.condition || 'N/A'}</Badge></TableCell>
                <TableCell>
                  <Badge variant={profile.linkedUserUid ? 'default' : 'secondary'}>
                    {profile.linkedUserUid ? 'Sí' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                     <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                       <DropdownMenuItem asChild>
                          <Link href={`/profile/${profile.documentId}`} target="_blank">
                              <Eye className="mr-2 h-4 w-4" /> Ver Perfil Público
                          </Link>
                      </DropdownMenuItem>
                      {canEdit && (
                        <>
                          <DropdownMenuItem onClick={() => {setSelectedProfile(profile); setIsEditDialogOpen(true);}}>
                            <Edit2 className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {setSelectedProfile(profile); setIsDeleteDialogOpen(true);}} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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

      {selectedProfile && isEditDialogOpen && (
        <EditStaffProfileDialog 
          profile={selectedProfile}
          isOpen={isEditDialogOpen}
          onClose={handleDialogClose}
        />
      )}
       {selectedProfile && isDeleteDialogOpen && (
        <DeleteStaffProfileDialog
          profile={selectedProfile}
          isOpen={isDeleteDialogOpen}
          onClose={handleDialogClose}
        />
       )}
    </>
  );
}
