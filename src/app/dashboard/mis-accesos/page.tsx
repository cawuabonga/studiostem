
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { AccessLog } from "@/types";
import { listenToAccessLogsForUser } from "@/config/firebase";
import { ProfileAccessLogs } from "@/components/profile/ProfileAccessLogs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyAccessHistoryPage() {
  const { user, instituteId } = useAuth();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.documentId || !instituteId) {
      setLoading(false);
      return;
    }

    setLoading(true);
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
