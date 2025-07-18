
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// This page has become redundant because /dashboard now handles redirection.
// We redirect from here to the new central academic page to avoid breaking old links.
export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user?.role === 'Admin' || user?.role === 'Coordinator') {
        router.replace('/dashboard/gestion-academica');
      } else {
        // Fallback for other roles like Teacher or Student
        // A welcome message could be shown here, or another redirect.
        // For now, redirecting to the main dashboard page which handles roles.
        router.replace('/dashboard');
      }
    }
  }, [user, loading, router]);

  // Show a loading state while redirecting
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-full max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-12 w-3/4 mx-auto" />
        <Skeleton className="h-8 w-full" />
        <p className="text-center text-muted-foreground mt-4">Cargando dashboard...</p>
      </div>
    </div>
  );
}
