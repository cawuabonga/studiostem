
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getStudentProfilesByInstitute } from '@/config/firebase';
import type { StudentProfile } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Copy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

interface StudentsTableProps {
    onDataChange: () => void;
}

export function StudentsTable({ onDataChange }: StudentsTableProps) {
  const [profiles, setProfiles] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const { toast } = useToast();
  const { instituteId } = useAuth();

  const fetchStudentProfiles = useCallback(async () => {
    if (!instituteId) {
        setLoading(false);
        return;
    }
    setLoading(true);
    try {
      const fetchedProfiles = await getStudentProfilesByInstitute(instituteId);
      setProfiles(fetchedProfiles);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los perfiles de estudiantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [instituteId, toast]);

  useEffect(() => {
    fetchStudentProfiles();
  }, [fetchStudentProfiles]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        toast({ title: "Copiado", description: "Código de activación copiado al portapapeles." });
    }, (err) => {
        toast({ title: "Error", description: "No se pudo copiar el código.", variant: "destructive" });
    });
  }

  const filteredProfiles = useMemo(() => 
    profiles.filter(profile => 
      (profile.displayName || '').toLowerCase().includes(filter.toLowerCase()) ||
      (profile.email || '').toLowerCase().includes(filter.toLowerCase())
    ), [profiles, filter]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3 mb-2" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!profiles.length) {
    return <p className="text-center text-muted-foreground py-4">No hay perfiles de estudiantes registrados en este instituto.</p>;
  }

  return (
    <>
      <div className="mb-4">
        <Input 
          placeholder="Buscar por nombre o email..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cód. Activación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfiles.map((profile) => (
              <TableRow key={profile.dni}>
                <TableCell className="font-medium">{profile.displayName || 'N/A'}</TableCell>
                <TableCell>{profile.email || 'N/A'}</TableCell>
                <TableCell className="font-mono text-xs">
                  {profile.activationCode ? (
                      <div className="flex items-center gap-2">
                          <span>{profile.activationCode}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(profile.activationCode!)}>
                              <Copy className="h-3 w-3" />
                          </Button>
                      </div>
                  ) : "N/A"}
                </TableCell>
                <TableCell>
                  <Badge variant={profile.claimed ? 'default' : 'outline'}>
                    {profile.claimed ? 'Reclamado' : 'Pendiente'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {/* Future actions for student profiles can be added here */}
                  <Button variant="ghost" size="icon" disabled>
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Editar Perfil</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
