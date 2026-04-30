
"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getAIConfig, saveAIConfig } from '@/config/firebase';
import type { AIConfig, AIProvider } from '@/types';
import { Loader2, Save, Wifi, WifiOff, Cpu, Globe, Info } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { testOllamaConnection } from '@/ai/actions/test-ollama-connection';

const aiConfigSchema = z.object({
  activeProvider: z.enum(['google', 'ollama']),
  ollamaUrl: z.string().url({ message: "Debe ser una URL válida (ej: https://...ngrok-free.app)" }).or(z.literal('')),
  ollamaModel: z.string().min(1, "Especifique el nombre del modelo (ej: llama3)"),
});

type AIConfigFormValues = z.infer<typeof aiConfigSchema>;

export function AIConfigManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'failed'>('none');

  const form = useForm<AIConfigFormValues>({
    resolver: zodResolver(aiConfigSchema),
    defaultValues: {
      activeProvider: 'google',
      ollamaUrl: '',
      ollamaModel: 'llama3',
    },
  });

  useEffect(() => {
    getAIConfig().then(config => {
      if (config) {
        form.reset({
          activeProvider: config.activeProvider || 'google',
          ollamaUrl: config.ollamaUrl || '',
          ollamaModel: config.ollamaModel || 'llama3',
        });
      }
      setLoading(false);
    });
  }, [form]);

  const onTestConnection = async () => {
    const url = form.getValues('ollamaUrl');
    if (!url) {
      toast({ title: "Atención", description: "Ingrese la URL de ngrok para probar.", variant: "destructive" });
      return;
    }

    setIsTesting(true);
    setConnectionStatus('none');
    
    // Ahora llamamos a la acción de servidor que es inmune a CORS y salta la advertencia de ngrok
    const isAlive = await testOllamaConnection(url);

    if (isAlive) {
      setConnectionStatus('success');
      toast({ title: "¡Conexión Exitosa!", description: "Ollama está respondiendo correctamente a través del servidor." });
    } else {
      setConnectionStatus('failed');
      toast({ 
        title: "Error de Conexión", 
        description: "No se pudo conectar con Ollama. Verifica que ngrok esté activo y el comando use --host-header=\"localhost:11434\".", 
        variant: "destructive" 
      });
    }
    setIsTesting(false);
  };

  const onSubmit = async (data: AIConfigFormValues) => {
    setIsSaving(true);
    try {
      await saveAIConfig(data);
      toast({ title: "Configuración Guardada", description: "Los cambios se aplicarán a todos los procesos de IA del sistema." });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar la configuración.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  const activeProvider = form.watch('activeProvider');

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="bg-primary/5 border-b">
          <div className="flex justify-between items-start">
             <div>
                <CardTitle className="text-2xl">Configuración de Inteligencia Artificial</CardTitle>
                <CardDescription>Configure si desea usar la IA de Google (Nube) o su instancia local de Ollama (ngrok).</CardDescription>
             </div>
             <Badge variant={activeProvider === 'google' ? 'default' : 'secondary'} className="h-6">
                {activeProvider === 'google' ? <Globe className="mr-2 h-3 w-3"/> : <Cpu className="mr-2 h-3 w-3"/>}
                Cerebro Actual: {activeProvider.toUpperCase()}
             </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <FormField
                control={form.control}
                name="activeProvider"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Proveedor Activo de IA</FormLabel>
                    <FormControl>
                       <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger className="h-12 border-primary/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="google">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-blue-500" />
                                        <span>Google AI (Gemini 2.0 Flash) - Nube</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="ollama">
                                    <div className="flex items-center gap-2">
                                        <Cpu className="h-4 w-4 text-orange-500" />
                                        <span>Ollama (Local via ngrok) - Hardware Propio</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                       </Select>
                    </FormControl>
                    <FormDescription>Seleccione qué motor procesará las peticiones de texto en toda la plataforma.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {activeProvider === 'ollama' && (
                <div className="space-y-6 animate-in slide-in-from-top-4 duration-500 bg-muted/30 p-6 rounded-xl border-2 border-dashed">
                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="ollamaUrl"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold">URL del Túnel ngrok</FormLabel>
                                <div className="flex gap-2">
                                    <FormControl>
                                        <Input {...field} placeholder="https://xxxx-xxxx.ngrok-free.app" className="font-mono h-11" />
                                    </FormControl>
                                    <Button type="button" variant="secondary" onClick={onTestConnection} disabled={isTesting}>
                                        {isTesting ? <Loader2 className="animate-spin h-4 w-4" /> : <Wifi className="h-4 w-4" />}
                                        <span className="ml-2 hidden sm:inline">Probar</span>
                                    </Button>
                                </div>
                                <FormDescription>Pegue la URL dinámica que genera ngrok en su PC local.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="ollamaModel"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold">Nombre del Modelo</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="ej: llama3, mistral, phi3" className="h-11" />
                                </FormControl>
                                <FormDescription>El modelo debe estar descargado en su Ollama local.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                    {connectionStatus !== 'none' && (
                        <div className={cn(
                            "p-3 rounded-lg flex items-center gap-2 text-sm font-medium",
                            connectionStatus === 'success' ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"
                        )}>
                            {connectionStatus === 'success' ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                            {connectionStatus === 'success' ? "Conexión establecida con éxito." : "Error: No se pudo conectar con Ollama. Revise la URL."}
                        </div>
                    )}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" disabled={isSaving} className="w-full sm:w-auto h-12 px-8">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Configuración IA
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card className="bg-muted/50 border-dashed">
         <CardHeader>
            <CardTitle className="text-sm uppercase font-bold flex items-center gap-2 text-muted-foreground">
                <Info className="h-4 w-4" /> Guía de Conexión Local
            </CardTitle>
         </CardHeader>
         <CardContent className="text-xs space-y-2 text-muted-foreground">
            <p>1. Inicie Ollama en su PC y asegúrese de que el servidor esté activo (Puerto 11434).</p>
            <p>2. Ejecute el túnel: <code className="bg-background px-1 py-0.5 rounded">ngrok http 11434 --host-header="localhost:11434"</code>.</p>
            <p>3. Copie la URL HTTPS generada y péguela arriba.</p>
            <p>4. Haga clic en "Probar" para validar la comunicación.</p>
            <p className="font-bold text-primary">Nota: El plan gratuito de ngrok cambia la URL cada vez que reinicia el proceso. Deberá actualizarla aquí.</p>
         </CardContent>
      </Card>
    </div>
  );
}
