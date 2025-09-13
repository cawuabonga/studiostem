
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { AccessLog } from "@/types";
import { getAccessLogsForUser } from "@/config/firebase";
import { ProfileAccessLogs } from "@/components/profile/ProfileAccessLogs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MyAccessHistoryPage() {
  const { user, instituteId } = useAuth();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (user?.documentId && instituteId) {
        setLoading(true);
        try {
          const userLogs = await getAccessLogsForUser(instituteId, user.documentId, 50); // Fetch up to 50 logs
          setLogs(userLogs);
        } catch (error) {
          console.error("Error fetching user access logs:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user, instituteId]);

  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle>Mi Historial de Accesos</CardTitle>
          <CardDescription>
            Aquí puedes ver tus últimos registros de entrada y salida en la institución.
          </CardDescription>
        </CardHeader>
      </Card>
      <ProfileAccessLogs logs={logs} loading={loading} />
    </div>
  );
}
