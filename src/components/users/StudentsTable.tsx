
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getUsersByInstitute } from '@/config/firebase';
import type { AppUser } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { EditUserDialog } from './EditUserDialog';

interface StudentsTableProps {
    onDataChange: () => void;
}

export function StudentsTable({ onDataChange }: StudentsTableProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const { toast } = useToast();
  const { instituteId } = useAuth();

  const fetchUsers = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const fetchedUsers = await getUsersByInstitute(instituteId, ['Student']);
      setUsers(fetchedUsers);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los estudiantes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [instituteId, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleEditUser = (user: AppUser) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDialogClose = (updated?: boolean) => {
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    if (updated) {
        onDataChange();
        fetchUsers();
    }
  };

  const filteredUsers = useMemo(() => 
    users.filter(user => 
      (user.displayName || '').toLowerCase().includes(filter.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(filter.toLowerCase())
    ), [users, filter]);

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
    return <p className="text-center text-muted-foreground py-4">No hay estudiantes registrados en este instituto.</p>;
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
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.uid}>
                <TableCell className="font-medium">{user.displayName || 'N/A'}</TableCell>
                <TableCell>{user.email || 'N/A'}</TableCell>
                <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                <TableCell className="text-right">
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
        <EditUserDialog
          user={selectedUser}
          isOpen={isEditDialogOpen}
          onClose={handleDialogClose}
        />
      )}
    </>
  );
}
