

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getStaffProfiles, getPrograms, getRoles } from '@/config/firebase';
import type { StaffProfile, Program, Role } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, MoreHorizontal, Eye, KeyRound, ArrowRight } from 'lucide-react';
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

interface StaffTableProps {
    instituteId: string;
    onDataChange: () => void;
    isAttendanceReportMode?: boolean;
}

const PAGE_SIZE = 10;

export function StaffTable({ instituteId, onDataChange, isAttendanceReportMode = false }: StaffTableProps) {
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [programs, setPrograms] = useState<Map<string, Program>>(new Map());
  const [roles, setRoles] = useState<Map<string, Role>>(new Map());
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
      setProfiles(fetchedStaff);
      setPrograms(new Map(fetchedPrograms.map(p => [p.id, p])));
      setRoles(new Map(fetchedRoles.map(r => [r.id, r])));
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los perfiles del personal.",
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
  }, [instituteId, fetchData, onDataChange]);

  const handleDialogClose = (updated?: boolean) => {
    setIsEditDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedProfile(null);
    if (updated) {
      onDataChange();
    }
  };

  const filteredProfiles = useMemo(() =>
    profiles.filter(profile =>
        profile.displayName.toLowerCase().includes(filter.toLowerCase()) ||
        profile.documentId.toLowerCase().includes(filter.toLowerCase()) ||
        profile.email.toLowerCase().includes(filter.toLowerCase())
    ), [profiles, filter]);
  
  const paginatedProfiles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredProfiles.slice(start, end);
  }, [filteredProfiles, currentPage]);

  const totalPages = Math.ceil(filteredProfiles.length / PAGE_SIZE);
  
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
  
  if (!profiles.length) {
    return <p className="text-center text-muted-foreground py-8">No hay perfiles de personal registrados.</p>;
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
              <TableHead>N° Documento</TableHead>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>ID Tarjeta</TableHead>
              <TableHead>Vinculado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProfiles.map((profile) => (
              <TableRow key={`${profile.documentId}-${profile.email}`}>
                <TableCell className="font-mono">{profile.documentId}</TableCell>
                <TableCell className="font-medium">{profile.displayName}</TableCell>
                <TableCell>{roles.get(profile.roleId)?.name || profile.role || 'N/A'}</TableCell>
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
                   {isAttendanceReportMode ? (
                       <Button asChild variant="outline" size="sm">
                            <Link href={`/dashboard/gestion-administrativa/reporte-asistencia/${profile.documentId}`}>
                                Ver Reporte <ArrowRight className="ml-2 h-4 w-4" />
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
                   )}
                </TableCell>
              </TableRow>
            ))}
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
