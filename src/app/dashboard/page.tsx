
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect to the institute selector page which will handle the next step.
      router.push('/dashboard/institute');
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
       <div className="w-full max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-10 w-full" />
          <p className="text-center text-muted-foreground mt-4">Redirigiendo...</p>
        </div>
    </div>
  );
}
