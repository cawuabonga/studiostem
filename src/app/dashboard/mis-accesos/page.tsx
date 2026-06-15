
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { AccessLog } from "@/types";
import { listenToAccessLogsForUser } from "@/config/firebase";
import { ProfileAccessLogs } from "@/components/profile/ProfileAccessLogs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function MyAccessHistoryPage() {
  const { user, instituteId, hasPermission, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !hasPermission('user:access:view:own')) {
      router.push('/dashboard');
    }
  }, [authLoading, hasPermission, router]);

  useEffect(() => {
    if (!user?.documentId || !instituteId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    // CORRECTED: Now calls the function that filters by user
    const unsubscribe = listenToAccessLogsForUser(
      instituteId,
      user.documentId,
      (newLogs) => {
        setLogs(newLogs);
        if (loading) setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.documentId, instituteId]);

  if (authLoading) return <p className="p-8">Cargando...</p>;

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle>Mi Historial de Accesos</CardTitle>
          <CardDescription>
            Aquí puedes ver tus últimos registros de entrada y salida en la institución, actualizados en tiempo real.
          </CardDescription>
        </CardHeader>
      </Card>
      <ProfileAccessLogs logs={logs} loading={loading} />
    </div>
  );
}
