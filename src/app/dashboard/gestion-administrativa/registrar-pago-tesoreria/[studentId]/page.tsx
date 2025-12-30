
"use client";

import React, { useState, useEffect } from 'react';
import { getStudentProfile } from '@/config/firebase';
import type { StudentProfile } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TreasuryRegisterPaymentForm } from '@/components/payments/TreasuryRegisterPaymentForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TreasuryStudentPaymentPage() {
  const { studentId } = useParams();
  const { instituteId } = useAuth();
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (instituteId && studentId) {
      getStudentProfile(instituteId, studentId as string)
        .then(setStudent)
        .finally(() => setLoading(false));
    }
  }, [instituteId, studentId]);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!student) {
    return <p>Estudiante no encontrado.</p>;
  }

  return (
    <div className="space-y-6">
        <Button variant="ghost" asChild>
            <Link href="/dashboard/gestion-administrativa/registrar-pago-tesoreria">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a la búsqueda
            </Link>
        </Button>

        <Card>
            <CardHeader>
                <CardTitle>Nuevo Pago para: {student.fullName}</CardTitle>
                <CardDescription>
                Completa el formulario y adjunta el voucher para registrar y aprobar el pago.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <TreasuryRegisterPaymentForm student={student} />
            </CardContent>
        </Card>
    </div>
  );
}
