
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
        // If the user is a student and does not have a documentId,
        // they are considered unlinked and must be redirected to the linking page.
        if (user.role === 'Student' && !user.documentId) {
            router.replace('/dashboard/link-profile');
            return;
        }

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
  
  if (loading || (user?.role === 'Student' && !user.documentId)) {
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
