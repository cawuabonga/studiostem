
"use client";

import { StudentMatriculationSheet } from "@/components/matricula/StudentMatriculationSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function StudentMatriculationPage({ params }: { params: { studentId: string } }) {
    const { instituteId } = useAuth();
    const router = useRouter();
    const studentId = params.studentId;

    if (!instituteId) {
        return (
             <div className="space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <Skeleton className="h-96 w-full" />
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
