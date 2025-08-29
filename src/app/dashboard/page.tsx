
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Permission } from "@/types";

// Define a prioritized list of routes based on permissions.
// The first match will be used for redirection.
const roleRedirects: { permission: Permission; route: string }[] = [
  { permission: 'superadmin:institute:manage', route: '/dashboard/superadmin/manage-institutes' },
  { permission: 'academic:program:manage', route: '/dashboard/gestion-academica' }, // Admin, Coordinator
  { permission: 'teacher:unit:view', route: '/dashboard/docente' },
  { permission: 'student:unit:view', route: '/dashboard/academic' },
];

export default function DashboardRedirectPage() {
  const { user, loading, hasPermission } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Don't do anything while loading.
    }
    
    if (!user) {
        router.replace('/');
        return;
    }

    // Find the first route the user has permission for.
    for (const redirect of roleRedirects) {
      if (hasPermission(redirect.permission)) {
        router.replace(redirect.route);
        return;
      }
    }
    
    // Fallback for any other roles or if role is not defined yet,
    // or if the user has a role with no specific dashboard permissions.
    // SuperAdmin without permissions (edge case) will also be handled by the check above.
    // The most common case for this default is a brand new user who needs to link their profile.
    router.replace('/dashboard/academic');

  }, [user, loading, router, hasPermission]);

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
