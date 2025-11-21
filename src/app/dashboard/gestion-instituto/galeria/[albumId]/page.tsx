"use client";

import { PhotoManager } from "@/components/institute/PhotoManager";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";


export default function AlbumDetailPage() {
  const { hasPermission, loading, instituteId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const albumId = pathname.split('/').pop() || '';

  useEffect(() => {
    if (!loading && !hasPermission('admin:institute:manage')) {
      router.push('/dashboard');
    }
  }, [loading, hasPermission, router]);

  if (loading || !hasPermission('admin:institute:manage') || !instituteId) {
    return <p>Cargando o no autorizado...</p>
  }
  
  if (!albumId) {
      return <p>ID de Álbum no encontrado.</p>
  }

  return (
    <div className="space-y-6">
        <Button variant="ghost" asChild>
            <Link href="/dashboard/gestion-instituto/galeria">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Álbumes
            </Link>
        </Button>
        <PhotoManager instituteId={instituteId} albumId={albumId} />
    </div>
  );
}
