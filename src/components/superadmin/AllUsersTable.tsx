"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllUsersPaginated, getInstitutes, getTotalUsersCount } from '@/config/firebase';
import type { AppUser, Institute } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Loader2 } from 'lucide-react';
import { SuperAdminEditUserDialog } from './SuperAdminEditUserDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import type { DocumentSnapshot } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AllUsersTableProps {
    onDataChange: () => void;
}

const PAGE_SIZE = 20;

export function AllUsersTable({ onDataChange }: AllUsersTableProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Filters
  const [textFilter, setTextFilter] = useState('');
  const [instituteFilter, setInstituteFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [pageHistory, setPageHistory] = useState<(DocumentSnapshot | null)[]>([null]);
  const [isLastPage, setIsLastPage] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  const { toast } = useToast();

  const fetchUsersAndInstitutes = useCallback(async (pageDirection: 'next' | 'prev' | 'first' = 'first') => {
    setLoading(true);

    let cursor: DocumentSnapshot | null = null;
    let newPage = currentPage;

    if (pageDirection === 'next' && !isLastPage) {
        cursor = lastVisible;
        newPage = currentPage + 1;
        setPageHistory(prev => [...prev, lastVisible]);
    } else if (pageDirection === 'prev' && currentPage > 1) {
        newPage = currentPage - 1;
        cursor = pageHistory[newPage - 1] || null; // Use stored cursor for previous page
        setPageHistory(prev => prev.slice(0, newPage));
    } else { // 'first' or other cases
        newPage = 1;
        cursor = null;
        setPageHistory([null]);
    }
    setCurrentPage(newPage);
    
    try {
        const [{ users: fetchedUsers, lastVisible: newLastVisible }, fetchedInstitutes, total] = await Promise.all([
            getAllUsersPaginated({ instituteId: instituteFilter === 'all' ? undefined : instituteFilter, limit: PAGE_SIZE, startAfter: cursor || undefined }),
            getInstitutes(),
            getTotalUsersCount(instituteFilter === 'all' ? undefined : instituteFilter)
        ]);
        
        setUsers(fetchedUsers);
        setLastVisible(newLastVisible);
        setIsLastPage(!newLastVisible || fetchedUsers.length < PAGE_SIZE);
        setInstitutes(fetchedInstitutes);
        setTotalUsers(total);

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
  }, [toast, instituteFilter, currentPage, lastVisible, pageHistory, isLastPage]); // Dependencies for the callback

  useEffect(() => {
    fetchUsersAndInstitutes('first');
  }, [instituteFilter]);

  const handleDialogClose = (updated?: boolean) => {
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    if (updated) {
        fetchUsersAndInstitutes('first');
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
        return (user.displayName || '').toLowerCase().includes(textFilter.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(textFilter.toLowerCase()) ||
            (user.instituteId || '').toLowerCase().includes(textFilter.toLowerCase()) ||
            instituteName.toLowerCase().includes(textFilter.toLowerCase());
    }), [users, textFilter, instituteMap]);


  if (loading && currentPage === 1) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full mb-2" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Input 
          placeholder="Buscar en la página actual..."
          value={textFilter}
          onChange={(e) => setTextFilter(e.target.value)}
          className="max-w-sm"
        />
        <Select value={instituteFilter} onValueChange={setInstituteFilter}>
            <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue placeholder="Filtrar por instituto" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos los Institutos</SelectItem>
                {institutes.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
            </SelectContent>
        </Select>
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
            {loading ? (
                 <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin"/></TableCell></TableRow>
            ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                <TableRow key={user.uid}>
                    <TableCell className="font-medium py-2">{user.displayName || 'N/A'}</TableCell>
                    <TableCell className="py-2">{user.email || 'N/A'}</TableCell>
                    <TableCell className="py-2"><Badge variant="secondary">{user.role}</Badge></TableCell>
                    <TableCell className="py-2">{user.instituteId ? instituteMap.get(user.instituteId) || 'ID no encontrado' : 'No Asignado'}</TableCell>
                    <TableCell className="font-mono text-xs py-2">{user.instituteId || ''}</TableCell>
                    <TableCell className="text-right py-2">
                    <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(user); setIsEditDialogOpen(true);}}>
                        <Edit2 className="h-4 w-4" />
                        <span className="sr-only">Editar Usuario</span>
                    </Button>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">No se encontraron usuarios.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
            Total de {totalUsers} usuario(s).
        </div>
        <div className="space-x-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsersAndInstitutes('prev')}
                disabled={currentPage === 1 || loading}
            >
                Anterior
            </Button>
            <span className="text-sm text-muted-foreground">Página {currentPage}</span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsersAndInstitutes('next')}
                disabled={isLastPage || loading}
            >
                Siguiente
            </Button>
        </div>
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
