
"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface UseAuthRedirectOptions {
  redirectTo?: string;
  protect?: boolean; // If true, protects the route, requires authentication
  redirectIfAuthenticated?: boolean; // If true, redirects if user is already authenticated (e.g., from login page)
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const { 
    redirectTo = '', 
    protect = false, 
    redirectIfAuthenticated = false 
  } = options;

  useEffect(() => {
    if (loading) {
      return; // Don't do anything while loading
    }

    if (protect && !user) {
      // Logic for branded redirect fallback
      let finalRedirect = '/';
      if (typeof window !== 'undefined') {
          const stickyInstituteId = localStorage.getItem('instituteId');
          // Don't redirect SuperAdmin to institutional login if they were just viewing it
          if (stickyInstituteId) {
              finalRedirect = `/login/${stickyInstituteId}`;
          }
      }
      
      const target = redirectTo || finalRedirect;
      if (pathname !== target) {
          router.push(target);
      }
      return;
    }
    
    if (redirectIfAuthenticated && user) {
      router.push(redirectTo || '/dashboard');
    }

  }, [user, loading, router, protect, redirectIfAuthenticated, redirectTo, pathname]);

  return { user, loading };
}
