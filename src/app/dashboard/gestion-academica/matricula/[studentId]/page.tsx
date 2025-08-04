
"use client";

import { StudentMatriculationSheet } from "@/components/matricula/StudentMatriculationSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";

export default function StudentMatriculationPage() {
    const { instituteId } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const studentId = pathname.split('/').pop() || '';
    
    if (!instituteId) {
        return (
             <div className="space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    if (!studentId) {
        return (
            <div>
                 <Button variant="ghost" onClick={() => router.push('/dashboard/gestion-academica/matricula')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al listado
                </Button>
                <p>No se ha proporcionado un ID de estudiante.</p>
            </div>
        )
    }

    return (
        <div>
            <Button variant="ghost" onClick={() => router.push('/dashboard/gestion-academica/matricula')} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al listado de estudiantes
            </Button>
            <StudentMatriculationSheet
                instituteId={instituteId}
                studentId={studentId}
            />
        </div>
    );
}
