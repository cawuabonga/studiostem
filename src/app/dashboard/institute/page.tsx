
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

// This is a temporary component to simulate institute selection.
// In the future, this page would show a list of institutes the user belongs to.
// For now, it will automatically select a default institute and redirect.

const DEFAULT_INSTITUTE_ID = "istp-principal";

export default function InstituteSelectorPage() {
  const { user, loading, setInstitute, instituteId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait until auth state is resolved

    if (!user) {
      // If for some reason the user is not authenticated, send them to login.
      router.replace('/');
      return;
    }

    // If an institute is already selected, redirect to dashboard.
    if (instituteId) {
      router.replace('/dashboard');
      return;
    }

    // If no institute is selected, set the default one.
    // The change in context will trigger a re-render and the condition above will redirect.
    if (!instituteId) {
      console.log(`Setting default institute ID: ${DEFAULT_INSTITUTE_ID}`);
      setInstitute(DEFAULT_INSTITUTE_ID);
    }

  }, [user, loading, instituteId, setInstitute, router]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
       <div className="w-full max-w-md mx-auto space-y-4 text-center">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <h2 className="text-xl font-semibold mt-4">Seleccionando Instituto</h2>
          <p className="text-muted-foreground">Por favor, espere...</p>
          <Skeleton className="h-32 w-full" />
        </div>
    </div>
  );
}
