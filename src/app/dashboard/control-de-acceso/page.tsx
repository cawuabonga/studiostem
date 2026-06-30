
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { AccessLogTable } from "@/components/access-control/AccessLogTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings, History, Loader2, ChevronLeft, ChevronRight, Search, Zap } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getAccessLogsPaginated, getAccessPoints, listenToAccessLogs } from "@/config/firebase";
import type { AccessLog, AccessPoint } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DocumentSnapshot } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 10;

export default function ControlDeAccesoPage() {
  const { hasPermission, loading: authLoading, instituteId } = useAuth();
  const router = useRouter();
  
  // Data State
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [dniSearch, setDniSearch] = useState('');
  const [selectedPointId, setSelectedPointId] = useState('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth()).toString());
  const [selectedDay, setSelectedDay] = useState('all');

  // Pagination State
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null);
  const [page, setPage] = useState(1);
  const [isLastPage, setIsLastPage] = useState(false);
  const [pageHistory, setPageHistory] = useState<(DocumentSnapshot | null)[]>([null]);

  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString()), []);
  const months = [
    { value: 'all', label: 'Todos los Meses' },
    { value: '0', label: 'Enero' }, { value: '1', label: 'Febrero' }, { value: '2', label: 'Marzo' },
    { value: '3', label: 'Abril' }, { value: '4', label: 'Mayo' }, { value: '5', label: 'Junio' },
    { value: '6', label: 'Julio' }, { value: '7', label: 'Agosto' }, { value: '8', label: 'Septiembre' },
    { value: '9', label: 'Octubre' }, { value: '10', label: 'Noviembre' }, { value: '11', label: 'Diciembre' }
  ];
  const days = useMemo(() => ['all', ...Array.from({ length: 31 }, (_, i) => (i + 1).toString())], []);

  useEffect(() => {
    if (!authLoading && !hasPermission('admin:access-control:manage')) {
      router.push('/dashboard');
    }
  }, [authLoading, hasPermission, router]);

  useEffect(() => {
    if (instituteId) {
        getAccessPoints(instituteId).then(setAccessPoints).catch(console.error);
    }
  }, [instituteId]);

  // Logic to build query options based on filters
  const queryOptions = useMemo(() => {
    if (!instituteId) return null;

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (selectedYear !== 'all') {
        const y = parseInt(selectedYear);
        if (selectedMonth === 'all') {
            startDate = new Date(y, 0, 1);
            endDate = new Date(y, 11, 31, 23, 59, 59);
        } else {
            const m = parseInt(selectedMonth);
            if (selectedDay === 'all') {
                startDate = new Date(y, m, 1);
                endDate = new Date(y, m + 1, 0, 23, 59, 59);
            } else {
                const d = parseInt(selectedDay);
                startDate = new Date(y, m, d);
                endDate = new Date(y, m, d, 23, 59, 59);
            }
        }
    }

    return {
        instituteId,
        accessPointId: selectedPointId,
        userDocumentId: dniSearch || undefined,
        startDate,
        endDate,
        limitCount: PAGE_SIZE,
    };
  }, [instituteId, selectedPointId, dniSearch, selectedYear, selectedMonth, selectedDay]);


  // Real-time synchronization when on page 1
  useEffect(() => {
    if (page === 1 && queryOptions) {
        setLoading(true);
        const unsubscribe = listenToAccessLogs(queryOptions, (newLogs, newLastVisible) => {
            setLogs(newLogs);
            setLastVisible(newLastVisible);
            setIsLastPage(!newLastVisible || newLogs.length < PAGE_SIZE);
            setLoading(false);
        });
        return () => unsubscribe();
    }
  }, [page, queryOptions]);

  const fetchLogs = useCallback(async (direction: 'next' | 'prev' | 'first' = 'first') => {
    if (!instituteId || !queryOptions) return;
    
    // Si estamos en la página 1, el useEffect del listener ya maneja la carga.
    // Solo ejecutamos fetchLogs manual para paginación (Página 2 en adelante).
    if (direction === 'first' && page === 1) return;

    setLoading(true);

    let cursor: DocumentSnapshot | null = null;
    let newPage = page;

    if (direction === 'next') {
        cursor = lastVisible;
        newPage = page + 1;
        setPageHistory(prev => [...prev, lastVisible]);
    } else if (direction === 'prev') {
        newPage = page > 1 ? page - 1 : 1;
        cursor = pageHistory[newPage - 1] || null;
        setPageHistory(prev => prev.slice(0, newPage));
    } else {
        newPage = 1;
        cursor = null;
        setPageHistory([null]);
    }
    setPage(newPage);

    if (newPage > 1) {
        try {
            const { logs: fetchedLogs, lastVisible: newLastVisible } = await getAccessLogsPaginated({
                ...queryOptions,
                startAfterDoc: cursor,
            });

            setLogs(fetchedLogs);
            setLastVisible(newLastVisible);
            setIsLastPage(!newLastVisible || fetchedLogs.length < PAGE_SIZE);
        } catch (error) {
            console.error("Error fetching access logs:", error);
        } finally {
            setLoading(false);
        }
    }
  }, [instituteId, queryOptions, page, lastVisible, pageHistory]);

  const handleDniSearch = (e: React.FormEvent) => {
      e.preventDefault();
      setPage(1);
      setPageHistory([null]);
  }

  if (authLoading) return <p className="p-8">Verificando seguridad...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <CardTitle className="flex items-center gap-2">
                    Control de Acceso e Identidad
                    {page === 1 && (
                        <Badge className="bg-green-100 text-green-700 animate-pulse border-green-200 uppercase font-black text-[9px] h-5">
                            <Zap className="h-3 w-3 mr-1 fill-current" /> Monitor en Vivo
                        </Badge>
                    )}
                </CardTitle>
                <CardDescription>
                    Auditoría de eventos capturados por los lectores RFID en tiempo real.
                </CardDescription>
            </div>
            <Button asChild className="shadow-lg">
                <Link href="/dashboard/control-de-acceso/puntos-de-acceso">
                    <Settings className="mr-2 h-4 w-4" />
                    Gestionar Puntos de Acceso
                </Link>
            </Button>
        </CardHeader>
      </Card>
      
      {/* Filtros Avanzados */}
      <Card className="border-primary/10 shadow-md">
        <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="space-y-2">
                    <Label htmlFor="year-select" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Año</Label>
                    <Select value={selectedYear} onValueChange={(v) => { setSelectedYear(v); setPage(1); }}>
                        <SelectTrigger id="year-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="month-select" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Mes</Label>
                    <Select value={selectedMonth} onValueChange={(v) => { setSelectedMonth(v); setPage(1); }}>
                        <SelectTrigger id="month-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="day-select" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Día</Label>
                    <Select value={selectedDay} onValueChange={(v) => { setSelectedDay(v); setPage(1); }} disabled={selectedMonth === 'all'}>
                        <SelectTrigger id="day-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Cualquier día</SelectItem>
                            {days.slice(1).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="point-select" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Punto de Acceso</Label>
                    <Select value={selectedPointId} onValueChange={(v) => { setSelectedPointId(v); setPage(1); }}>
                        <SelectTrigger id="point-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los lectores</SelectItem>
                            {accessPoints.map(p => <SelectItem key={p.id} value={p.accessPointId}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <form onSubmit={handleDniSearch} className="space-y-2">
                    <Label htmlFor="dni-search" className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Búsqueda por DNI</Label>
                    <div className="flex gap-2">
                        <Input
                            id="dni-search"
                            placeholder="Ingrese DNI..."
                            value={dniSearch}
                            onChange={(e) => setDniSearch(e.target.value)}
                        />
                        <Button type="submit" variant="secondary" size="icon">
                             <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-xl">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Historial de Eventos</CardTitle>
            </div>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <AccessLogTable logs={logs} loading={loading && logs.length === 0} />
          
          <div className="flex items-center justify-between py-4 border-t">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Página {page} {isLastPage && " (Fin del historial)"}
            </div>
            <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchLogs('prev')} 
                    disabled={page === 1 || loading}
                    className="font-bold"
                >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Anterior
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchLogs('next')} 
                    disabled={isLastPage || loading}
                    className="font-bold"
                >
                    Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
