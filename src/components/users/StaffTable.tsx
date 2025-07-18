
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getStaffProfilesByInstitute } from '@/config/firebase';
import type { StaffProfile } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { EditStaffProfileDialog } from './EditStaffProfileDialog';

interface StaffTableProps {
    onDataChange: () => void;
}

export function StaffTable({ onDataChange }: StaffTableProps) {
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<StaffProfile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const { toast } = useToast();
  const { instituteId } = useAuth();

  const fetchStaffProfiles = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const fetchedProfiles = await getStaffProfilesByInstitute(instituteId);
      setProfiles(fetchedProfiles);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el personal.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [instituteId, toast]);

  useEffect(() => {
    fetchStaffProfiles();
  }, [fetchStaffProfiles]);

  const handleEditProfile = (profile: StaffProfile) => {
    setSelectedProfile(profile);
    setIsEditDialogOpen(true);
  };

  const handleDialogClose = (updated?: boolean) => {
    setIsEditDialogOpen(false);
    setSelectedProfile(null);
    if (updated) {
        onDataChange();
        fetchStaffProfiles();
    }
  };

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
    return <p className="text-center text-muted-foreground py-4">No hay perfiles de personal registrados en este instituto.</p>;
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
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfiles.map((profile) => (
              <TableRow key={profile.dni}>
                <TableCell className="font-medium">{profile.displayName || 'N/A'}</TableCell>
                <TableCell>{profile.email || 'N/A'}</TableCell>
                <TableCell><Badge variant="secondary">{profile.role}</Badge></TableCell>
                 <TableCell>
                  <Badge variant={profile.claimed ? 'default' : 'outline'}>
                    {profile.claimed ? 'Reclamado' : 'Pendiente'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEditProfile(profile)} disabled={profile.claimed}>
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Editar Perfil</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {selectedProfile && (
        <EditStaffProfileDialog
          profile={selectedProfile}
          isOpen={isEditDialogOpen}
          onClose={handleDialogClose}
        />
      )}
    </>
  );
}
