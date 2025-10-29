

"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { addContentToWeek, updateContentInWeek } from '@/config/firebase';
import type { Content, ContentType, Unit } from '@/types';
import { Loader2 } from 'lucide-react';

const contentTypes: ContentType[] = ['text', 'link', 'file'];
const contentTypeLabels: Record<ContentType, string> = {
    text: 'Texto Plano',
    link: 'Enlace (URL)',
    file: 'Archivo (PDF, Word, etc.)',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const addContentSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres.'),
  type: z.enum(contentTypes, { required_error: 'Debe seleccionar un tipo de contenido.' }),
  value: z.string().optional(),
  file: z.instanceof(FileList).optional(),
}).refine(data => {
    if (data.type === 'link') {
        try {
            new URL(data.value || '');
            return true;
        } catch (_) {
            return false;
        }
    }
    return true;
}, {
    message: 'Por favor, ingrese una URL válida.',
    path: ['value'],
}).refine(data => {
    if (data.type === 'text') {
        return !!data.value && data.value.length > 0;
    }
    if (data.type === 'link') {
        return !!data.value;
    }
    return true;
}, {
    message: 'El contenido es requerido.',
    path: ['value'],
}).refine(data => {
     if (data.type === 'file') {
        return data.file && data.file.length > 0;
    }
    return true;
}, {
    message: 'Debe seleccionar un archivo.',
    path: ['file'],
})
.refine(data => {
    if (data.type === 'file' && data.file && data.file[0]) {
        return data.file[0].size <= MAX_FILE_SIZE;
    }
    return true;
}, {
    message: `El tamaño máximo del archivo es ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
    path: ['file'],
});

type AddContentFormValues = z.infer<typeof addContentSchema>;

interface AddContentFormProps {
  unit: Unit;
  weekNumber: number;
  initialData?: Content | null;
  onDataChanged: () => void;
  onCancel: () => void;
}

export function AddContentForm({ unit, weekNumber, initialData, onDataChanged, onCancel }: AddContentFormProps) {
  const { instituteId } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const isEditMode = !!initialData;

  const form = useForm<AddContentFormValues>({
    resolver: zodResolver(addContentSchema),
    defaultValues: {
        title: initialData?.title || '',
        type: initialData?.type || 'text',
        value: (initialData?.type !== 'file' && initialData?.value) ? initialData.value : '',
        file: undefined
    },
  });

   useEffect(() => {
    if (initialData) {
        form.reset({
            title: initialData.title,
            type: initialData.type,
            value: (initialData.type !== 'file' && initialData.value) ? initialData.value : '',
            file: undefined,
        })
    } else {
        form.reset({ title: '', type: 'text', value: '', file: undefined });
    }
  }, [initialData, form]);

  const contentType = form.watch('type');

  const onSubmit = async (data: AddContentFormValues) => {
    console.log("[DEBUG] AddContentForm: onSubmit triggered.");
    console.log("[DEBUG] Form data:", data);

    if (!instituteId) {
        console.error("[DEBUG] Institute ID not found.");
        toast({ title: 'Error de Autenticación', description: 'No se pudo encontrar la información del instituto. Por favor, vuelve a iniciar sesión.', variant: 'destructive'});
        return;
    };
    
    setLoading(true);

    try {
        const file = data.file?.[0];
        console.log("[DEBUG] Extracted file:", file);
        const contentData: Partial<Content> = { title: data.title, type: data.type, value: data.value || '' };
        
        if (isEditMode && initialData) {
             console.log("[DEBUG] Calling updateContentInWeek...");
             await updateContentInWeek(instituteId, unit.id, weekNumber, initialData.id, contentData, file);
             toast({ title: '¡Éxito!', description: 'El contenido ha sido actualizado.' });
        } else {
            console.log("[DEBUG] Calling addContentToWeek...");
            await addContentToWeek(instituteId, unit.id, weekNumber, contentData as Omit<Content, 'id'>, file);
            toast({ title: '¡Éxito!', description: 'El contenido ha sido añadido a la semana.' });
        }
        
        console.log("[DEBUG] Operation successful in form.");
        form.reset();
        onDataChanged();

    } catch (error: any) {
      console.error("[DEBUG] Error caught in AddContentForm onSubmit:", error);
      toast({
        title: 'Error',
        description: error.message || `No se pudo ${isEditMode ? 'actualizar' : 'añadir'} el contenido.`,
        variant: 'destructive',
      });
    } finally {
      console.log("[DEBUG] AddContentForm: finally block reached.");
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl>
                    <Input placeholder="Ej: Lectura sobre la Célula" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Tipo de Contenido</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditMode}>
                    <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {contentTypes.map(type => (
                            <SelectItem key={type} value={type}>{contentTypeLabels[type]}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>

        {contentType === 'text' && (
            <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Contenido de Texto</FormLabel>
                    <FormControl>
                        <Textarea placeholder="Escriba aquí el contenido..." {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}

        {contentType === 'link' && (
            <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>URL del Enlace</FormLabel>
                    <FormControl>
                        <Input placeholder="https://ejemplo.com/recurso" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
        )}
        
        {contentType === 'file' && (
            <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Subir Archivo</FormLabel>
                    <FormControl>
                        <Input type="file" {...form.register('file')} />
                    </FormControl>
                    {isEditMode && <p className="text-xs text-muted-foreground">Deje este campo vacío para conservar el archivo existente. Seleccione uno nuevo para reemplazarlo.</p>}
                     <FormMessage />
                </FormItem>
                )}
            />
        )}

        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Actualizar Contenido' : 'Añadir Contenido'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
