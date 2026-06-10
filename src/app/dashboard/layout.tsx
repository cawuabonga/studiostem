
"use client";

import React, { useEffect } from "react";
import DashboardMainLayout from "@/components/layout/DashboardMainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, instituteId, loading, institute } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // La protección de ruta ahora la maneja DashboardMainLayout a través del hook useAuthRedirect
    // solo manejamos la redirección a selección de instituto para Admins sin sede.
    if (user && !instituteId && user.role === 'Admin') {
       router.push('/dashboard/institute');
    }
  }, [user, instituteId, loading, router]);

  useEffect(() => {
    // Apply theme colors dynamically
    if (institute?.primaryColor) {
      document.documentElement.style.setProperty('--primary', institute.primaryColor);
    }
  }, [institute]);

  // Si es una ruta de impresión, no envolvemos en el layout del dashboard
  // Esto evita que h-screen y overflow-hidden corten las páginas al imprimir
  const isPrintRoute = pathname.includes('/print');

  if (isPrintRoute) {
      return (
        <div className="bg-white min-h-screen w-full overflow-visible">
            {children}
        </div>
      );
  }

  // Show loading skeleton only when the auth context is loading.
  if (loading) {
     return (
       <DashboardMainLayout>
          <div className="space-y-4">
              <Skeleton className="h-10 w-1/3 mb-4" />
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
       </DashboardMainLayout>
     )
  }

  return <DashboardMainLayout>{children}</DashboardMainLayout>;
}
