
"use client";

import React from 'react';
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
import { Home, Settings, User, ShieldQuestion, Image as ImageIcon, Users, BookCopy, Library, List, Contact, ClipboardCheck, BarChart } from 'lucide-react';
import AppLogo from '../common/AppLogo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AppSidebarContents() {
  const { user } = useAuth();
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home, exact: true, roles: ['Admin', 'Coordinator', 'Teacher', 'Student'] },
  ];
  
  const adminItems = [
    { href: '/dashboard/admin/manage-users', label: 'Gestionar Usuarios', icon: Users, roles: ['Admin'] },
    { href: '/dashboard/admin/manage-programs', label: 'Programas de Estudio', icon: Library, roles: ['Admin'] },
    { href: '/dashboard/admin/manage-login-image', label: 'Imagen de Inicio', icon: ImageIcon, roles: ['Admin'] }
  ];

  const academicItems = [
      { href: '/dashboard/academic/manage-teachers', label: 'Gestionar Docentes', icon: Contact, roles: ['Admin', 'Coordinator'] },
      { href: '/dashboard/academic/manage-units', label: 'Listado de Unidades', icon: List, exact: true, roles: ['Admin', 'Coordinator'] },
      { href: '/dashboard/academic/manage-units/register', label: 'Registrar Unidad', icon: BookCopy, roles: ['Admin', 'Coordinator'] },
      { href: '/dashboard/academic/assign-units', label: 'Asignar Unidades', icon: ClipboardCheck, roles: ['Admin', 'Coordinator'] },
      { href: '/dashboard/academic/reports', label: 'Reportes', icon: BarChart, roles: ['Admin', 'Coordinator'] },
  ];

  const allNavItems = [...navItems, ...adminItems, ...academicItems].filter(item => user?.role && item.roles.includes(user.role));


  return (
    <>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" aria-label="Ir al dashboard">
           <AppLogo className="text-xl text-sidebar-foreground" />
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
          {allNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton 
                  asChild 
                  isActive={
                    // @ts-ignore
                    item.exact ? pathname === item.href : pathname.startsWith(item.href)
                  }
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
