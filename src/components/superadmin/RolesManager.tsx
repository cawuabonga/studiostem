
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { getRoles, deleteRole } from '@/config/firebase';
import type { Role } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { AddRoleDialog } from './AddRoleDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface RolesManagerProps {
    instituteId: string;
}

export function RolesManager({ instituteId }: RolesManagerProps) {
    const { toast } = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const fetchRoles = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const fetchedRoles = await getRoles(instituteId);
            setRoles(fetchedRoles.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los roles.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [instituteId, toast]);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const handleOpenDialog = (role?: Role) => {
        setSelectedRole(role || null);
        setIsDialogOpen(true);
    };

    const handleDialogClose = (updated?: boolean) => {
        setIsDialogOpen(false);
        setSelectedRole(null);
        if (updated) {
            fetchRoles();
        }
    };

    const handleDelete = async () => {
        if (!roleToDelete || !instituteId) return;
        try {
            await deleteRole(instituteId, roleToDelete.id);
            toast({ title: "Rol Eliminado", description: `El rol "${roleToDelete.name}" ha sido eliminado.` });
            setRoleToDelete(null);
            fetchRoles();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar el rol.", variant: "destructive" });
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Roles Personalizados</CardTitle>
                        <CardDescription>
                            Roles y conjuntos de permisos para este instituto.
                        </CardDescription>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear Rol
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : roles.length > 0 ? (
                        <div className="space-y-2">
                            {roles.map(role => (
                                <div key={role.id} className="flex items-center justify-between rounded-md border p-4">
                                    <div>
                                        <p className="font-semibold">{role.name}</p>
                                        <p className="text-sm text-muted-foreground">{role.description}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(role)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                 <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setRoleToDelete(role)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción no se puede deshacer. Se eliminará el rol "{roleToDelete?.name}". Los usuarios con este rol perderán sus permisos.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={() => setRoleToDelete(null)}>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No hay roles personalizados creados para este instituto.</p>
                    )}
                </CardContent>
            </Card>

            <AddRoleDialog
                isOpen={isDialogOpen}
                onClose={handleDialogClose}
                instituteId={instituteId}
                existingRole={selectedRole}
            />
        </>
    );
}
