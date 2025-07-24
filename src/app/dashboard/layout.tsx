
"use client";

import React, { useEffect } from "react";
import DashboardMainLayout from "@/components/layout/DashboardMainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, instituteId, loading, institute } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
        router.push('/');
        return;
    }

    // If auth is loaded, user exists, but no institute is selected
    // This logic is now more specific and should only apply to users who NEED an institute
    // but don't have one, like Admins. New students are exempt from this check.
    if (user && !instituteId && user.role !== 'Student' && user.role !== 'SuperAdmin') {
       router.push('/dashboard/institute');
    }
  }, [user, instituteId, loading, router]);

  useEffect(() => {
    // Apply theme colors dynamically
    if (institute?.primaryColor) {
      document.documentElement.style.setProperty('--primary', institute.primaryColor);
    }
  }, [institute]);

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

  // Children now access institute data directly from the context.
  return <DashboardMainLayout>{children}</DashboardMainLayout>;
}
