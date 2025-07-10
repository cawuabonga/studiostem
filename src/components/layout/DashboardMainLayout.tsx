"use client";
import React from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger, SidebarRail } from '@/components/ui/sidebar';
import { AppSidebarContents } from './AppSidebarContents';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { Skeleton } from '../ui/skeleton';

export default function DashboardMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuthRedirect({ protect: true, redirectTo: '/' });

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

  return (
    <SidebarProvider defaultOpen={true} >
      <Sidebar variant="sidebar" collapsible="icon" side="left" className="sidebar-container">
        <AppSidebarContents />
      </Sidebar>
      <SidebarRail className="sidebar-container" />
      <SidebarInset className="main-content">
        <header className="page-header sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-xl font-semibold font-headline ml-auto md:ml-0">SA-NM-50</h1>
        </header>
        <main className="flex-1 p-4 md:p-6">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
