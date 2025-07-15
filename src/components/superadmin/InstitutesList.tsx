
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getInstitutes } from '@/config/firebase';
import type { Institute } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface InstitutesListProps {
    onDataChange: () => void;
}

export function InstitutesList({ onDataChange }: InstitutesListProps) {
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInstitutes = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedInstitutes = await getInstitutes();
      setInstitutes(fetchedInstitutes);
    } catch (error) {
      console.error("Error fetching institutes:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los institutos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInstitutes();
  }, [fetchInstitutes]);

  const handleEdit = (institute: Institute) => {
    toast({ title: "Próximamente", description: "La edición de institutos estará disponible en futuras versiones." });
  };
  
  const handleDelete = (institute: Institute) => {
     toast({ title: "Próximamente", description: "La eliminación de institutos estará disponible en futuras versiones." });
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  
  if (!institutes.length) {
    return <p className="text-center text-muted-foreground">No hay institutos registrados.</p>;
  }

  return (
    <>
      <div className="rounded-md border relative">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre del Instituto</TableHead>
              <TableHead>ID Único</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {institutes.map((institute) => (
              <TableRow key={institute.id}>
                <TableCell className="font-medium">{institute.name}</TableCell>
                <TableCell className="font-mono">{institute.id}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(institute)}>
                      <Edit2 className="h-4 w-4" />
                      <span className="sr-only">Editar Instituto</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(institute)} className="text-destructive hover:text-destructive" disabled>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar Instituto</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
