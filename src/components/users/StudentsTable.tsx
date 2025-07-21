
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getStudentProfiles, getPrograms } from '@/config/firebase';
import type { StudentProfile, Program } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from '../ui/input';
import Image from 'next/image';

interface StudentsTableProps {
    instituteId: string;
    onDataChange: () => void;
}

const PAGE_SIZE = 10;

export function StudentsTable({ instituteId, onDataChange }: StudentsTableProps) {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [programs, setPrograms] = useState<Map<string, Program>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const fetchData = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const [fetchedProfiles, fetchedPrograms] = await Promise.all([
        getStudentProfiles(id),
        getPrograms(id),
      ]);
      const programMap = new Map(fetchedPrograms.map(p => [p.id, p]));
      setProfiles(fetchedProfiles);
      setPrograms(programMap);
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
    }
  }, [instituteId, fetchData]);

  const filteredProfiles = useMemo(() =>
    profiles.filter(profile =>
        profile.fullName.toLowerCase().includes(filter.toLowerCase()) ||
        profile.dni.toLowerCase().includes(filter.toLowerCase()) ||
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
    return <p className="text-center text-muted-foreground">No hay perfiles de estudiantes registrados.</p>;
  }

  return (
    <>
      <div className="mb-4">
        <Input 
          placeholder="Buscar por nombre, DNI o email..."
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
              <TableHead>Foto</TableHead>
              <TableHead>DNI</TableHead>
              <TableHead>Nombre Completo</TableHead>
              <TableHead>Programa</TableHead>
              <TableHead>Vinculado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProfiles.map((profile) => (
              <TableRow key={profile.dni}>
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
                <TableCell className="font-mono">{profile.dni}</TableCell>
                <TableCell className="font-medium">{profile.fullName}</TableCell>
                <TableCell>{programs.get(profile.programId)?.name || 'N/A'}</TableCell>
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
                      <DropdownMenuItem disabled>Editar (Próximamente)</DropdownMenuItem>
                      <DropdownMenuItem disabled className="text-destructive">Eliminar (Próximamente)</DropdownMenuItem>
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
    </>
  );
}
