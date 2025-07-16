
"use client";
import React from 'react';
import Image from 'next/image';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebarContents } from './AppSidebarContents';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Building2 } from 'lucide-react';

export default function DashboardMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthRedirect({ protect: true, redirectTo: '/' });
  const { institute } = useAuth();

  if (loading || !user) {
    return (
       <div className="flex h-screen w-full items-center justify-center">
        <div className="space-y-4 w-full max-w-sm">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }
  
  const getHeaderTitle = () => {
    if (user?.role === 'SuperAdmin' && !institute) {
        return "SISTEMA TECNOLOGICO DE EDUCACION MODULAR";
    }
    return institute?.name || "Dashboard";
  }


  return (
    <SidebarProvider defaultOpen={true} >
      <Sidebar variant="sidebar" collapsible="icon" side="left" className="sidebar-container">
        <AppSidebarContents />
      </Sidebar>
      <SidebarRail className="sidebar-container" />
      <SidebarInset className="main-content">
        <header className="page-header sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
            <SidebarTrigger className="md:hidden" />
            <div className="ml-auto flex items-center gap-2 md:ml-0">
               {institute?.logoUrl ? (
                <Image src={institute.logoUrl} alt={`${institute.name} Logo`} width={24} height={24} className="rounded-sm object-contain"/>
              ) : (
                <Building2 className="h-6 w-6" />
              )}
              <h1 className="text-xl font-semibold font-headline">
                {getHeaderTitle()}
              </h1>
            </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
