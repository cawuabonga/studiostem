
"use client";

import DashboardMainLayout from "@/components/layout/DashboardMainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, cloneElement, isValidElement } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, instituteId, loading, institute } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
        router.push('/');
        return;
    }
    // If auth is loaded and there is no institute selected, redirect to the selector
    if (!loading && user && !instituteId) {
      if(user.role !== 'SuperAdmin'){
         router.push('/dashboard/institute');
      }
    }
  }, [user, instituteId, loading, router]);

  useEffect(() => {
    // Apply theme colors dynamically
    if (institute?.primaryColor) {
      const root = document.documentElement;
      // The value from DB is HSL, e.g., "225 65% 32%"
      root.style.setProperty('--primary', institute.primaryColor);
    }
  }, [institute]);

  // While loading user auth or institute data, show a loading state
  if (loading || (user && user.role !== 'SuperAdmin' && !institute)) {
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

  // Clone children to pass down institute prop if needed
  const childrenWithProps = React.Children.map(children, child => {
    if (isValidElement(child)) {
      // Pass institute and instituteId to page components
      return cloneElement(child, { institute, instituteId } as any);
    }
    return child;
  });

  return <DashboardMainLayout>{childrenWithProps}</DashboardMainLayout>;
}
