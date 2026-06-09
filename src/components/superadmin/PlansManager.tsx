"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getPlans, deletePlan } from '@/config/firebase';
import type { Plan } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, CheckCircle2, Rocket, Zap, Crown } from 'lucide-react';
import { AddPlanDialog } from './AddPlanDialog';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
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

export function PlansManager() {
    const { toast } = useToast();
    const [plans, setPosts] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    const fetchPlans = useCallback(async () => {
        setLoading(true);
        try {
            const fetched = await getPlans();
            setPosts(fetched);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los planes.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => { fetchPlans(); }, [fetchPlans]);

    const handleOpenDialog = (plan?: Plan) => {
        setSelectedPlan(plan || null);
        setIsDialogOpen(true);
    };

    const handleDelete = async (planId: string) => {
        try {
            await deletePlan(planId);
            toast({ title: "Plan Eliminado" });
            fetchPlans();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo eliminar el plan.", variant: "destructive" });
        }
    };

    const getPlanIcon = (index: number) => {
        if (index === 0) return <Zap className="h-6 w-6 text-blue-500" />;
        if (index === 1) return <Rocket className="h-6 w-6 text-purple-500" />;
        return <Crown className="h-6 w-6 text-amber-500" />;
    };

    if (loading) return <div className="grid md:grid-cols-3 gap-6"><Skeleton className="h-80 w-full" /><Skeleton className="h-80 w-full" /><Skeleton className="h-80 w-full" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-primary">Planes de Servicio Activos</h3>
                    <p className="text-sm text-muted-foreground">Define los paquetes comerciales para las instituciones.</p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="font-black shadow-lg">
                    <PlusCircle className="mr-2 h-4 w-4" /> CREAR NUEVO PLAN
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {plans.length > 0 ? plans.map((plan, idx) => (
                    <Card key={plan.id} className={cn(
                        "relative flex flex-col h-full border-2 transition-all hover:shadow-2xl rounded-3xl overflow-hidden",
                        !plan.isActive && "opacity-60 grayscale"
                    )}>
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto bg-muted p-3 rounded-2xl w-fit mb-4">
                                {getPlanIcon(idx)}
                            </div>
                            <CardTitle className="text-2xl font-black uppercase tracking-tight">{plan.name}</CardTitle>
                            <CardDescription className="line-clamp-2 text-xs font-medium">{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-6 pt-4">
                            <div className="text-center">
                                <span className="text-4xl font-black">S/ {plan.price.toFixed(0)}</span>
                                <span className="text-muted-foreground font-bold text-xs uppercase tracking-widest"> / {plan.billingCycle}</span>
                            </div>
                            
                            <Separator />
                            
                            <ul className="space-y-3">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-xs font-bold text-slate-600">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter className="border-t bg-muted/20 p-4 flex gap-2">
                            <Button variant="ghost" className="flex-1 font-bold" onClick={() => handleOpenDialog(plan)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar este plan?</AlertDialogTitle>
                                        <AlertDialogDescription>Esta acción no se puede deshacer y los institutos suscritos podrían verse afectados.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(plan.id)} className="bg-destructive hover:bg-destructive/90">Eliminar Plan</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardFooter>
                    </Card>
                )) : (
                    <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/10">
                        <Zap className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="font-bold uppercase">No has definido planes aún</p>
                    </div>
                )}
            </div>

            <AddPlanDialog
                isOpen={isDialogOpen}
                onClose={(updated) => {
                    setIsDialogOpen(false);
                    if (updated) fetchPlans();
                }}
                existingPlan={selectedPlan}
            />
        </div>
    );
}