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
    redirectTo = '/', 
    protect = false, 
    redirectIfAuthenticated = false 
  } = options;

  useEffect(() => {
    if (loading) {
      return; // Don't do anything while loading
    }

    if (protect && !user && pathname !== redirectTo) {
      // If route is protected and user is not logged in, redirect
      router.push(redirectTo || '/');
    }
    
    if (redirectIfAuthenticated && user) {
      // If route should redirect if authenticated (e.g. login/register page) and user is logged in
      router.push(redirectTo || '/dashboard');
    }

  }, [user, loading, router, protect, redirectIfAuthenticated, redirectTo, pathname]);

  return { user, loading };
}
