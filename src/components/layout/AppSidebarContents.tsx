
"use client";

import React from 'react';
import Image from 'next/image';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { Home, Users, Building2, Inbox, GraduationCap, Briefcase, Palette, Image as ImageIcon, BookCopy, Percent, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppSidebarContents() {
  const { user, institute } = useAuth();
  const pathname = usePathname();

  const superAdminItems = [
    { href: '/dashboard/superadmin/manage-institutes', label: 'Gestionar Institutos', icon: Building2, roles: ['SuperAdmin'] },
    { href: '/dashboard/superadmin/manage-users', label: 'Gestionar Usuarios', icon: Users, roles: ['SuperAdmin'] },
    { href: '/dashboard/superadmin/manage-login-image', label: 'Diseño e Imágenes Login', icon: ImageIcon, roles: ['SuperAdmin'] },
  ];

  const instituteAdminItems = [
    { href: '/dashboard/mesa-de-partes', label: 'Mesa de Partes', icon: Inbox, roles: ['Admin', 'Coordinator'] },
    { href: '/dashboard/gestion-academica', label: 'Gestión Académica', icon: GraduationCap, roles: ['Admin', 'Coordinator'] },
    { href: '/dashboard/gestion-administrativa', label: 'Gestión Administrativa', icon: CreditCard, roles: ['Admin', 'Coordinator', 'Student'] },
    { href: '/dashboard/gestion-usuarios', label: 'Gestionar Usuarios', icon: Users, roles: ['Admin', 'Coordinator'] },
  ];
  
  const teacherItems = [
      { href: '/dashboard/docente', label: 'Mis Unidades Asignadas', icon: BookCopy, roles: ['Teacher', 'Coordinator'] },
  ];

  const studentItems = [
    { href: '/dashboard/academic/mis-unidades', label: 'Mis Unidades Didácticas', icon: BookCopy, roles: ['Student'] },
    { href: '/dashboard/academic/grades', label: 'Mis Calificaciones', icon: Percent, roles: ['Student'] },
  ];

  const allNavItems = [...superAdminItems, ...instituteAdminItems, ...teacherItems, ...studentItems].filter(item => {
    if (!user?.role) return false;
    const isRoleMatch = item.roles.includes(user.role);
    // Basic deduplication by href
    return isRoleMatch;
  }).filter((item, index, self) => index === self.findIndex((t) => t.href === item.href));


  const getSidebarTitle = () => {
    if (user?.role === 'SuperAdmin' && !institute) {
        return "STEM";
    }
    return institute?.name || "STEM";
  }


  return (
    <>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" aria-label="Ir al dashboard" className="flex items-center gap-2">
           {institute?.logoUrl ? (
             <Image src={institute.logoUrl} alt={`${institute.name} Logo`} width={28} height={28} className="rounded-sm object-contain"/>
           ) : (
             <Building2 className="w-7 h-7 text-sidebar-foreground"/>
           )}
           <span className="font-headline text-sm font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
             {getSidebarTitle()}
           </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {user && (
          <div className="mb-4 p-2 flex flex-col items-center group-data-[collapsible=icon]:items-center">
            <Avatar className="w-16 h-16 mb-2 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:mb-0">
              <AvatarImage src={user.photoURL || `https://placehold.co/100x100.png?text=${user.displayName?.[0] || 'U'}`} alt={user.displayName || 'Usuario'} data-ai-hint="profile avatar" />
              <AvatarFallback className="text-xl group-data-[collapsible=icon]:text-sm">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-center group-data-[collapsible=icon]:hidden">
              <p className="font-semibold text-sidebar-foreground">{user.displayName}</p>
              <p className="text-xs text-sidebar-foreground/80">{user.role}</p>
            </div>
          </div>
        )}
        <SidebarSeparator className="my-2 group-data-[collapsible=icon]:hidden" />
        <SidebarMenu>
          <SidebarMenuItem>
              <Link href="/dashboard/academic" legacyBehavior passHref>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname === '/dashboard/academic' || pathname === '/dashboard'}
                  tooltip={{children: "Dashboard", side: 'right', align: 'center'}}
                >
                  <a>
                    <Home />
                    <span>Dashboard</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          {allNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{children: item.label, side: 'right', align: 'center'}}
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
         <SignOutButton 
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
            buttonText={''}
            showIcon={true}
            aria-label="Cerrar Sesión"
            tooltip={{children: 'Cerrar Sesión', side: 'right', align: 'center'}}
          >
            <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
        </SignOutButton>
      </SidebarFooter>
    </>
  );
}
