
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getNonTeachingActivities } from '@/config/firebase';
import type { NonTeachingActivity } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ActivityAssignmentDetails } from './ActivityAssignmentDetails';
import { ClipboardList, ArrowRight, BookOpen } from 'lucide-react';

export function ActivityMonitor() {
    const { instituteId } = useAuth();
    const [activities, setActivities] = useState<NonTeachingActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedActivity, setSelectedActivity] = useState<NonTeachingActivity | null>(null);

    const fetchData = useCallback(async () => {
        if (!instituteId) return;
        setLoading(true);
        try {
            const data = await getNonTeachingActivities(instituteId);
            setActivities(data.filter(a => a.isActive));
        } catch (error) {
            console.error("Error fetching monitor activities:", error);
        } finally {
            setLoading(false);
        }
    }, [instituteId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activities.length > 0 ? activities.map(activity => (
                    <Card key={activity.id} className="group hover:border-primary transition-all shadow-md rounded-2xl overflow-hidden flex flex-col border-primary/5">
                        <CardHeader className="pb-4">
                            <div className="bg-primary/5 p-3 rounded-xl w-fit mb-4 group-hover:bg-primary/10 transition-colors">
                                <ClipboardList className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-xl font-black uppercase tracking-tight leading-tight min-h-[3rem]">
                                {activity.name}
                            </CardTitle>
                            <CardDescription className="text-xs line-clamp-2 font-medium">
                                {activity.description}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4 mt-auto border-t bg-muted/20">
                            <Button variant="ghost" className="w-full font-black uppercase text-xs tracking-widest h-10" onClick={() => setSelectedActivity(activity)}>
                                VER DOCENTES ASIGNADOS <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                )) : (
                    <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-3xl">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-10" />
                        <p className="font-bold uppercase">No se han definido actividades todavía.</p>
                    </div>
                )}
            </div>

            {/* Modal: Detalle de Asignaciones filtrado por Programa */}
            <Dialog open={!!selectedActivity} onOpenChange={open => !open && setSelectedActivity(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                    <DialogHeader className="p-8 bg-primary text-primary-foreground shrink-0">
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                            <Users className="h-6 w-6" /> Supervisión: {selectedActivity?.name}
                        </DialogTitle>
                        <DialogDescription className="text-primary-foreground/80 font-medium">
                            Historial de cumplimiento y evidencias cargadas por los docentes.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-8">
                        {selectedActivity && <ActivityAssignmentDetails activityId={selectedActivity.id} />}
                    </div>
                    <DialogFooter className="p-6 bg-muted/20 border-t shrink-0">
                        <Button variant="ghost" onClick={() => setSelectedActivity(null)} className="font-black">CERRAR VISOR</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Users({ className }: { className?: string }) {
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
