
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
import { Home, Users, Building2, Inbox, GraduationCap, Briefcase, Palette, Image as ImageIcon, BookCopy, Percent, CreditCard, ShieldCheck, History, Fingerprint, FolderKanban, CalendarClock, LayoutDashboard, Newspaper, Pencil, Package, Award, MapPin, Cpu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Permission } from '@/types';

interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
    permission?: Permission | Permission[]; // Allow single or multiple permissions
    isDefault?: boolean; // For items always visible like Dashboard
}

const allNavItems: NavItem[] = [
    // SuperAdmin
    { href: '/dashboard/superadmin/manage-institutes', label: 'Gestionar Institutos', icon: Building2, permission: 'superadmin:institute:manage' },
    { href: '/dashboard/superadmin/manage-users', label: 'Gestionar Usuarios', icon: Users, permission: 'superadmin:users:manage' },
    { href: '/dashboard/superadmin/manage-roles', label: 'Gestionar Roles', icon: ShieldCheck, permission: 'superadmin:roles:manage' },
    { href: '/dashboard/superadmin/manage-ai', label: 'Configuración IA', icon: Cpu, permission: 'superadmin:design:manage' },
    { href: '/dashboard/superadmin/manage-login-image', label: 'Diseño e Imágenes Login', icon: ImageIcon, permission: 'superadmin:design:manage' },
    { href: '/dashboard/superadmin/documentation', label: 'Documentación', icon: FolderKanban, permission: 'superadmin:institute:manage' },

    // Institute Admin/Coordinator
    { href: '/dashboard/gestion-instituto', label: 'Gestión del Instituto', icon: LayoutDashboard, permission: 'admin:institute:manage' },
    { href: '/dashboard/mesa-de-partes', label: 'Mesa de Partes', icon: Inbox, permission: 'academic:program:manage' },
    { href: '/dashboard/gestion-academica', label: 'Gestión Académica', icon: GraduationCap, permission: ['academic:program:manage', 'academic:assignment:manage', 'academic:enrollment:manage', 'academic:workload:view', 'academic:efsrt:manage'] },
    { href: '/dashboard/planificacion', label: 'Planificación y Horarios', icon: CalendarClock, permission: ['planning:schedule:manage', 'planning:environment:manage', 'planning:schedule:view:own'] },
    { href: '/dashboard/gestion-administrativa', label: 'Gestión Administrativa', icon: CreditCard, permission: ['admin:fees:manage', 'admin:payments:validate', 'student:payments:manage', 'admin:supplies:manage', 'admin:deliveries:view'] },
    { href: '/dashboard/control-de-acceso', label: 'Control de Acceso', icon: Fingerprint, permission: 'admin:access-control:manage' },
    { href: '/dashboard/gestion-usuarios', label: 'Gestionar Usuarios', icon: Users, permission: ['users:staff:manage', 'users:student:manage'] },
    
    // Teacher
    { href: '/dashboard/docente', label: 'Mis Unidades Asignadas', icon: BookCopy, permission: 'teacher:unit:view' },
    { href: '/dashboard/docente/supervisiones', label: 'Supervisiones EFSRT', icon: MapPin, permission: 'teacher:efsrt:supervise' },

    // Student & General Staff
    { href: '/dashboard/academic/mis-unidades', label: 'Mis Unidades Didácticas', icon: BookCopy, permission: 'student:unit:view' },
    { href: '/dashboard/academic/efsrt', label: 'Mis Prácticas (EFSRT)', icon: MapPin, permission: 'student:efsrt:view' },
    { href: '/dashboard/academic/grades', label: 'Mis Calificaciones', icon: Percent, permission: 'student:grades:view' },
    { href: '/dashboard/solicitar-insumos', label: 'Solicitar Insumos', icon: Pencil, permission: 'user:supplies:request' },
    { href: '/dashboard/mis-pedidos', label: 'Mis Pedidos de Insumos', icon: Package, permission: 'user:supplies:request' },
];


export function AppSidebarContents() {
  const { user, institute, hasPermission } = useAuth();
  const pathname = usePathname();
  
  const accessibleNavItems = allNavItems.filter(item => {
      if (item.isDefault) return true;
      if (!item.permission) return true;

      // Handle both single and multiple permissions
      if (Array.isArray(item.permission)) {
          // If it's an array, check if user has at least one of the permissions
          return item.permission.some(p => hasPermission(p));
      } else {
          // If it's a single permission string
          return hasPermission(item.permission);
      }
  });
  
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
               {user.programName && (
                <p className="text-xs text-sidebar-foreground/70 italic mt-1">{user.programName}</p>
              )}
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
            {user?.documentId && (
                 <SidebarMenuItem>
                    <Link href="/dashboard/mis-accesos" legacyBehavior passHref>
                        <SidebarMenuButton 
                        asChild 
                        isActive={pathname.startsWith('/dashboard/mis-accesos')}
                        tooltip={{children: 'Mis Accesos', side: 'right', align: 'center'}}
                        >
                        <a>
                            <Fingerprint />
                            <span>Mis Accesos</span>
                        </a>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            )}
          {accessibleNavItems.map((item) => (
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
