
"use client";

import WelcomeMessage from "@/components/dashboard/WelcomeMessage";
import { CareerProgressTimeline } from "@/components/student/CareerProgressTimeline";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import React from 'react'; // Importar React para usar useEffect


// This page now serves as the primary welcome/landing page for students and teachers.
export default function DashboardAcademicPage() {
  const { user, loading } = useAuth();
  
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
        <WelcomeMessage />
        {user?.role === 'Student' && user.documentId && (
            <CareerProgressTimeline />
        )}
    </div>
  );
}
