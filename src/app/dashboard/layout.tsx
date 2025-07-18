
"use client";

import React, { useEffect, cloneElement, isValidElement } from "react";
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
    if (user && !instituteId) {
      // SuperAdmins don't need an institute.
      if(user.role !== 'SuperAdmin'){
         router.push('/dashboard/institute');
      }
    }
  }, [user, instituteId, loading, router]);

  useEffect(() => {
    // Apply theme colors dynamically
    if (institute?.primaryColor) {
      document.documentElement.style.setProperty('--primary', institute.primaryColor);
    }
  }, [institute]);

  // Show loading skeleton if auth is loading, or if the user is not a SuperAdmin and the institute data is not yet available.
  const showLoadingSkeleton = loading || (user && user.role !== 'SuperAdmin' && !institute);


  if (showLoadingSkeleton) {
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

  // Clone children to pass down institute props if needed.
  // This approach is generally safe for passing context-like props to immediate page components.
  const childrenWithProps = React.Children.map(children, child => {
    if (isValidElement(child)) {
      // Pass institute and instituteId to page components
      return cloneElement(child, { institute, instituteId } as React.Attributes & { institute: any, instituteId: any });
    }
    return child;
  });

  return <DashboardMainLayout>{childrenWithProps}</DashboardMainLayout>;
}
