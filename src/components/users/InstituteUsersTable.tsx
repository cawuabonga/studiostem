
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getUsersFromInstitute } from '@/config/firebase';
import type { AppUser } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

interface InstituteUsersTableProps {
    instituteId: string;
    onDataChange: () => void;
}

export function InstituteUsersTable({ instituteId, onDataChange }: InstituteUsersTableProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const { toast } = useToast();

  const fetchUsers = useCallback(async (id: string) => {
      setLoading(true);
      try {
        const fetchedUsers = await getUsersFromInstitute(id);
        setUsers(fetchedUsers);
      } catch (error: any) {
        console.error("Error fetching institute users:", error);
        toast({
          title: "Error",
          description: error.message || "No se pudieron cargar los usuarios del instituto.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
  }, [toast]);

  useEffect(() => {
    fetchUsers(instituteId);
  }, [fetchUsers, instituteId]);

  const filteredUsers = useMemo(() =>
    users.filter(user => 
        (user.displayName || '').toLowerCase().includes(filter.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(filter.toLowerCase()) ||
        (user.role || '').toLowerCase().includes(filter.toLowerCase())
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
    return <p>No hay usuarios registrados en este instituto.</p>;
  }

  return (
    <>
      <div className="mb-4">
        <Input 
          placeholder="Buscar por nombre, email o rol..."
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
              <TableHead>DNI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.uid}>
                <TableCell className="font-medium">{user.displayName || 'N/A'}</TableCell>
                <TableCell>{user.email || 'N/A'}</TableCell>
                <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                <TableCell>{user.dni || 'No registrado'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
