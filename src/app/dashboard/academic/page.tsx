
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import WelcomeMessage from "@/components/dashboard/WelcomeMessage";
import { Skeleton } from "@/components/ui/skeleton";


// This page now serves as the primary welcome/landing page for most authenticated users.
export default function DashboardAcademicPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
        // Admins/Coordinators/SuperAdmins get redirected from the main dashboard page
        // to their respective management views. This page is primarily for linked
        // students and teachers.
        if (user.role === 'Admin' || user.role === 'Coordinator') {
            router.replace('/dashboard/gestion-academica');
        } else if (user.role === 'SuperAdmin') {
            router.replace('/dashboard/superadmin/manage-institutes');
        }
    }
  }, [user, loading, router]);
  
  // This page is primarily for Students and Teachers.
  // The WelcomeMessage component will handle the display logic,
  // including the prompt to link a profile for new students.
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

  // For Students and Teachers, or while redirects are being processed, show the welcome message.
  return <WelcomeMessage />;
}
