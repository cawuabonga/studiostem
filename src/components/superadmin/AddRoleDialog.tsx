
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { addRole, updateRole } from '@/config/firebase';
import type { Role, Permission } from '@/types';
import { PERMISSIONS_CONFIG } from '@/types';
import { Loader2 } from 'lucide-read';

const addRoleSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  permissions: z.array(z.string()).refine(value => value.some(item => item), {
    message: "Debes seleccionar al menos un permiso.",
  }),
});

type AddRoleFormValues = z.infer<typeof addRoleSchema>;

interface AddRoleDialogProps {
  isOpen: boolean;
  onClose: (updated?: boolean) => void;
  instituteId: string;
  existingRole?: Role | null;
}

export function AddRoleDialog({ isOpen, onClose, instituteId, existingRole }: AddRoleDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!existingRole;

  const form = useForm<AddRoleFormValues>({
    resolver: zodResolver(addRoleSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && existingRole) {
        form.reset({
          id: existingRole.id,
          name: existingRole.name,
          description: existingRole.description,
          permissions: existingRole.permissions,
        });
      } else {
        form.reset({
          name: '',
          description: '',
          permissions: [],
        });
      }
    }
  }, [isOpen, existingRole, isEditMode, form]);


  const onSubmit = async (data: AddRoleFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditMode && existingRole) {
        await updateRole(instituteId, existingRole.id, {
            name: data.name,
            description: data.description,
            permissions: data.permissions as Permission[]
        });
        toast({ title: 'Éxito', description: 'El rol ha sido actualizado.' });
      } else {
        const roleId = data.name.toLowerCase().replace(/\s+/g, '_');
        await addRole(instituteId, roleId, {
            name: data.name,
            description: data.description,
            permissions: data.permissions as Permission[]
        });
        toast({ title: 'Éxito', description: 'El rol ha sido creado.' });
      }
      onClose(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || `No se pudo ${isEditMode ? 'actualizar' : 'crear'} el rol.`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Rol' : 'Crear Nuevo Rol'}</DialogTitle>
          <DialogDescription>
            Define un nombre, una descripción y asigna los permisos correspondientes para este rol.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto flex-1 pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre del Rol</FormLabel>
                    <FormControl>
                        <Input placeholder="Ej: Contador" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe brevemente las responsabilidades de este rol..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Permisos</h3>
                 <FormField
                    control={form.control}
                    name="permissions"
                    render={() => (
                        <div className="space-y-4">
                            {PERMISSIONS_CONFIG.map((category) => (
                                <div key={category.category} className="rounded-md border p-4">
                                    <h4 className="font-semibold">{category.category}</h4>
                                    <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                                    <div className="space-y-2">
                                    {category.permissions.map((item) => (
                                        <FormField
                                        key={item.id}
                                        control={form.control}
                                        name="permissions"
                                        render={({ field }) => {
                                            return (
                                            <FormItem
                                                key={item.id}
                                                className="flex flex-row items-start space-x-3 space-y-0"
                                            >
                                                <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(item.id)}
                                                    onCheckedChange={(checked) => {
                                                    return checked
                                                        ? field.onChange([...field.value, item.id])
                                                        : field.onChange(
                                                            field.value?.filter(
                                                            (value) => value !== item.id
                                                            )
                                                        )
                                                    }}
                                                />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                {item.label}
                                                </FormLabel>
                                            </FormItem>
                                            )
                                        }}
                                        />
                                    ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                 />
            </div>
            
             <DialogFooter className="sticky bottom-0 bg-background pt-4">
              <DialogClose asChild>
                <Button type="button" variant="ghost" onClick={() => onClose()}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Guardar Cambios' : 'Crear Rol'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
