
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import WelcomeMessage from "@/components/dashboard/WelcomeMessage";


// This page now serves as the primary welcome/landing page for most authenticated users.
export default function DashboardAcademicPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
        // This page is mainly for Students and Teachers.
        // Admins/Coordinators get redirected from the main dashboard page.
        // SuperAdmins also get redirected.
        // This prevents users with higher roles from landing on a generic welcome page.
        if (user.role === 'Admin' || user.role === 'Coordinator') {
            router.replace('/dashboard/gestion-academica');
        } else if (user.role === 'SuperAdmin') {
            router.replace('/dashboard/superadmin/manage-institutes');
        }
    }
  }, [user, loading, router]);

  // For Students and Teachers, or while redirects are being processed, show the welcome message.
  return <WelcomeMessage />;
}
