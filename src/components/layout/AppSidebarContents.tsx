
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
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Permission } from '@/types';

// Using icons directly from lucide-react
import { 
  Home as HomeIcon, 
  Users as UsersIcon, 
  Building2 as Building2Icon, 
  Inbox as InboxIcon, 
  GraduationCap as GraduationCapIcon, 
  CreditCard as CreditCardIcon, 
  ShieldCheck as ShieldCheckIcon, 
  ImageIcon as GalleryIcon, 
  BookCopy as BookCopyIcon, 
  Percent as PercentIcon, 
  Fingerprint as FingerprintIcon, 
  FolderKanban as FolderKanbanIcon, 
  CalendarClock as CalendarClockIcon, 
  LayoutDashboard as LayoutDashboardIcon, 
  Pencil as PencilIcon, 
  Package as PackageIcon, 
  MapPin as MapPinIcon, 
  Cpu as CpuIcon, 
  BriefcaseBusiness as BriefcaseBusinessIcon,
  CreditCard as PlansIcon,
  History as HistoryIcon
} from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    permission?: Permission | Permission[]; 
    isDefault?: boolean;
}

const allNavItems: NavItem[] = [
    // SuperAdmin
    { href: '/dashboard/superadmin/manage-institutes', label: 'Gestionar Institutos', icon: Building2Icon, permission: 'superadmin:institute:manage' },
    { href: '/dashboard/superadmin/manage-users', label: 'Gestionar Usuarios', icon: UsersIcon, permission: 'superadmin:users:manage' },
    { href: '/dashboard/superadmin/manage-roles', label: 'Gestionar Roles', icon: ShieldCheckIcon, permission: 'superadmin:roles:manage' },
    { href: '/dashboard/superadmin/manage-plans', label: 'Gestionar Planes', icon: PlansIcon, permission: 'superadmin:plans:manage' },
    { href: '/dashboard/superadmin/manage-ai', label: 'Configuración IA', icon: CpuIcon, permission: 'superadmin:design:manage' },
    { href: '/dashboard/superadmin/manage-login-image', label: 'Diseño e Imágenes Login', icon: GalleryIcon, permission: 'superadmin:design:manage' },
    { href: '/dashboard/superadmin/documentation', label: 'Documentación', icon: FolderKanbanIcon, permission: 'superadmin:institute:manage' },

    // Institute Admin/Coordinator
    { href: '/dashboard/gestion-instituto', label: 'Gestión del Instituto', icon: LayoutDashboardIcon, permission: 'admin:institute:manage' },
    { href: '/dashboard/mesa-de-partes', label: 'Mesa de Partes', icon: InboxIcon, permission: 'academic:program:manage' },
    { href: '/dashboard/gestion-academica', label: 'Gestión Académica', icon: GraduationCapIcon, permission: ['academic:program:manage', 'academic:assignment:manage', 'academic:enrollment:manage', 'academic:workload:view', 'academic:efsrt:manage'] },
    { href: '/dashboard/planificacion', label: 'Planificación y Horarios', icon: CalendarClockIcon, permission: ['planning:schedule:manage', 'planning:environment:manage', 'planning:schedule:view:own'] },
    { href: '/dashboard/gestion-administrativa', label: 'Gestión Administrativa', icon: CreditCardIcon, permission: ['admin:fees:manage', 'admin:payments:validate', 'student:payments:manage', 'admin:supplies:manage', 'admin:deliveries:view', 'admin:companies:manage'] },
    { href: '/dashboard/control-de-acceso', label: 'Control de Acceso', icon: FingerprintIcon, permission: 'admin:access-control:manage' },
    { href: '/dashboard/gestion-usuarios', label: 'Gestionar Usuarios', icon: UsersIcon, permission: ['users:staff:manage', 'users:student:manage'] },
    
    // Bolsa Laboral (Visible para Alumnos y Empresas)
    { href: '/dashboard/bolsa-laboral', label: 'Bolsa de Trabajo', icon: BriefcaseBusinessIcon, permission: ['student:jobs:view', 'company:jobs:manage'] },

    // Teacher
    { href: '/dashboard/docente', label: 'Mis Unidades Asignadas', icon: BookCopyIcon, permission: 'teacher:unit:view' },
    { href: '/dashboard/docente/supervisiones', label: 'Supervisiones EFSRT', icon: MapPinIcon, permission: 'teacher:efsrt:supervise' },

    // Student & General Staff
    { href: '/dashboard/academic/mis-unidades', label: 'Mis Unidades Didácticas', icon: BookCopyIcon, permission: 'student:unit:view' },
    { href: '/dashboard/academic/efsrt', label: 'Mis Prácticas (EFSRT)', icon: MapPinIcon, permission: 'student:efsrt:view' },
    { href: '/dashboard/academic/grades', label: 'Mis Calificaciones', icon: PercentIcon, permission: 'student:grades:view' },
    { href: '/dashboard/mis-accesos', label: 'Mis Accesos', icon: HistoryIcon, permission: 'user:access:view:own' },
    { href: '/dashboard/solicitar-insumos', label: 'Solicitar Insumos', icon: PencilIcon, permission: 'user:supplies:request' },
    { href: '/dashboard/mis-pedidos', label: 'Mis Pedidos de Insumos', icon: PackageIcon, permission: 'user:supplies:request' },
];


export function AppSidebarContents() {
  const { user, institute, hasPermission } = useAuth();
  const pathname = usePathname();
  
  const accessibleNavItems = allNavItems.filter(item => {
      if (item.isDefault) return true;
      if (!item.permission) return true;
      if (Array.isArray(item.permission)) {
          return item.permission.some(p => hasPermission(p));
      } else {
          return hasPermission(item.permission);
      }
  });
  
  const getSidebarTitle = () => {
    if (user?.role === 'SuperAdmin' && !institute) return "STEM";
    return institute?.name || "STEM";
  }

  return (
    <>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" aria-label="Ir al dashboard" className="flex items-center gap-2">
           {institute?.logoUrl ? (
             <Image src={institute.logoUrl} alt={`${institute.name} Logo`} width={28} height={28} className="rounded-sm object-contain"/>
           ) : (
             <GraduationCapIcon className="w-7 h-7 text-sidebar-foreground"/>
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
              <AvatarImage src={user.photoURL || `https://placehold.co/100x100.png?text=${user.displayName?.[0] || 'U'}`} alt={user.displayName || 'Usuario'} />
              <AvatarFallback className="text-xl group-data-[collapsible=icon]:text-sm">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="text-center group-data-[collapsible=icon]:hidden px-2">
              <p className="font-semibold text-sidebar-foreground text-sm leading-tight">{user.displayName}</p>
              <p className="text-[10px] uppercase font-black tracking-tighter text-sidebar-foreground/60 leading-tight mt-1">
                  {user.roleName || (user.role === 'Student' ? 'Estudiante' : user.role)}
              </p>
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
                  tooltip="Dashboard"
                >
                  <a>
                    <HomeIcon />
                    <span>Dashboard</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            
          {accessibleNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname.startsWith(item.href)}
                  tooltip={item.label}
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
            className="w-full justify-start font-black uppercase tracking-widest text-[10px] shadow-xl group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 bg-white/10 text-white hover:bg-accent hover:text-accent-foreground transition-all border-none"
            buttonText={''}
            showIcon={true}
            aria-label="Cerrar Sesión"
          >
            <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
        </SignOutButton>
      </SidebarFooter>
    </>
  );
}
