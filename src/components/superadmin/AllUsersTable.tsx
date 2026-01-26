"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllUsersFromAllInstitutes, getInstitutes } from '@/config/firebase';
import type { AppUser, Institute } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';
import { SuperAdminEditUserDialog } from './SuperAdminEditUserDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

interface AllUsersTableProps {
    onDataChange: () => void;
}

export function AllUsersTable({ onDataChange }: AllUsersTableProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const { toast } = useToast();

  const fetchUsersAndInstitutes = useCallback(async () => {
      setLoading(true);
      try {
        const [fetchedUsers, fetchedInstitutes] = await Promise.all([
            getAllUsersFromAllInstitutes(),
            getInstitutes(),
        ]);
        setUsers(fetchedUsers);
        setInstitutes(fetchedInstitutes);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos de la plataforma.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
  }, [toast]);

  useEffect(() => {
    fetchUsersAndInstitutes();
  }, [fetchUsersAndInstitutes]);

  const handleEditUser = (user: AppUser) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDialogClose = (updated?: boolean) => {
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    if (updated) {
        fetchUsersAndInstitutes();
        onDataChange();
    }
  };

  const instituteMap = useMemo(() => 
    new Map(institutes.map(institute => [institute.id, institute.name])),
    [institutes]
  );

  const filteredUsers = useMemo(() =>
    users.filter(user => {
        const instituteName = user.instituteId ? instituteMap.get(user.instituteId) || '' : '';
        return (user.displayName || '').toLowerCase().includes(filter.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(filter.toLowerCase()) ||
            (user.instituteId || '').toLowerCase().includes(filter.toLowerCase()) ||
            instituteName.toLowerCase().includes(filter.toLowerCase());
    }), [users, filter, instituteMap]);


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

  if (!users.length) {
    return <p>No hay usuarios registrados en la plataforma.</p>;
  }

  return (
    <>
      <div className="mb-4">
        <Input 
          placeholder="Buscar por nombre, email o nombre de instituto..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Instituto</TableHead>
              <TableHead>ID Instituto</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.uid}>
                <TableCell className="font-medium py-2">{user.displayName || 'N/A'}</TableCell>
                <TableCell className="py-2">{user.email || 'N/A'}</TableCell>
                <TableCell className="py-2"><Badge variant="secondary">{user.role}</Badge></TableCell>
                <TableCell className="py-2">{user.instituteId ? instituteMap.get(user.instituteId) || 'ID no encontrado' : 'No Asignado'}</TableCell>
                <TableCell className="font-mono text-xs py-2">{user.instituteId || ''}</TableCell>
                <TableCell className="text-right py-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                    <Edit2 className="h-4 w-4" />
                    <span className="sr-only">Editar Usuario</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {selectedUser && (
        <SuperAdminEditUserDialog
          user={selectedUser}
          isOpen={isEditDialogOpen}
          onClose={handleDialogClose}
        />
      )}
    </>
  );
}
