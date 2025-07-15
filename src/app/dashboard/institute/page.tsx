
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
  const { user, loading, setInstitute } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // In a real scenario, you might check if an institute is already selected
      // or present a list. For now, we set a default one.
      console.log(`Setting default institute ID: ${DEFAULT_INSTITUTE_ID}`);
      setInstitute(DEFAULT_INSTITUTE_ID);
      
      // Redirect to the main academic dashboard after setting the institute.
      router.replace('/dashboard/academic');

    } else if (!loading && !user) {
        // If for some reason the user is not authenticated, send them to login.
        router.replace('/');
    }
  }, [user, loading, setInstitute, router]);

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
