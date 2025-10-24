
"use client";

import WelcomeMessage from "@/components/dashboard/WelcomeMessage";
import { CareerProgressTimeline } from "@/components/student/CareerProgressTimeline";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import React from 'react'; // Importar React para usar useEffect


// This page now serves as the primary welcome/landing page for students and teachers.
export default function DashboardAcademicPage() {
  const { user, loading, hasPermission } = useAuth();
  
    // --- INICIO DEL CÓDIGO DE DEPURACIÓN ---
  React.useEffect(() => {
    if (!loading && user) {
      console.log("--- DEBUG: AuthContext User Object ---");
      console.log(user);
      console.log("-------------------------------------");
    }
  }, [user, loading]);
  // --- FIN DEL CÓDIGO DE DEPURACIÓN ---

  if (loading) {
      return (
          <div className="space-y-4">
              <Skeleton className="h-10 w-1/3 mb-4" />
              <Skeleton className="h-8 w-1/2" />
              <div className="space-y-2 pt-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
              </div>
          </div>
      )
  }

  // The WelcomeMessage component will handle the display logic for all user types
  // that land here, including showing the link profile button for new, unlinked students.
  return (
    <div className="space-y-8">
        {/* --- INICIO DEL BLOQUE DE VISUALIZACIÓN DE DEBUG --- */}
        <div className="bg-destructive/20 border border-destructive text-destructive-foreground p-4 rounded-md font-mono text-xs">
          <h3 className="font-bold text-lg mb-2">DEBUGGING INFO:</h3>
          <p><strong>User UID:</strong> {user?.uid}</p>
          <p><strong>User Role:</strong> {user?.role}</p>
          <p><strong>User RoleID:</strong> {user?.roleId}</p>
          <p><strong>Institute ID:</strong> {user?.instituteId}</p>
          <p><strong>Program ID:</strong> {user?.programName}</p>
          <p><strong>Permissions Array:</strong> {JSON.stringify(user?.permissions, null, 2)}</p>
          <p><strong>Test: hasPermission('academic:unit:manage:own')?</strong> {hasPermission('academic:unit:manage:own') ? 'TRUE' : 'FALSE'}</p>
        </div>
        {/* --- FIN DEL BLOQUE DE VISUALIZACIÓN DE DEBUG --- */}

        <WelcomeMessage />
        {user?.role === 'Student' && user.documentId && (
            <CareerProgressTimeline />
        )}
    </div>
  );
}
