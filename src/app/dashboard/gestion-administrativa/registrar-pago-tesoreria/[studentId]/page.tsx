"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { getStudentProfile, getStaffProfileByDocumentId } from '@/config/firebase';
import type { StudentProfile, StaffProfile } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TreasuryRegisterPaymentForm } from '@/components/payments/TreasuryRegisterPaymentForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type PayerProfile = (StudentProfile | StaffProfile) & { type: 'student' | 'staff' | 'external' };

function TreasuryStudentPaymentPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { instituteId } = useAuth();
  
  const documentId = params.studentId as string;
  const payerType = searchParams.get('type') as 'student' | 'staff' | 'external';
  const externalName = searchParams.get('name');

  const [profile, setProfile] = useState<PayerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (instituteId && documentId && payerType) {
      setLoading(true);
      if (payerType === 'external') {
        setProfile({
            documentId: documentId,
            displayName: externalName || 'Pagador Externo',
            fullName: externalName || 'Pagador Externo',
            type: 'external'
        } as any);
        setLoading(false);
      } else if (payerType === 'student') {
        getStudentProfile(instituteId, documentId).then(p => {
          if(p) setProfile({ ...p, type: 'student' });
          setLoading(false);
        });
      } else if (payerType === 'staff') {
        getStaffProfileByDocumentId(instituteId, documentId).then(p => {
          if(p) setProfile({ ...p, type: 'staff' });
          setLoading(false);
        });
      }
    }
  }, [instituteId, documentId, payerType, externalName]);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!profile) {
    return <p>Perfil del pagador no encontrado.</p>;
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
                <CardTitle>Nuevo Pago para: {profile.fullName || profile.displayName}</CardTitle>
                <CardDescription>
                Completa el formulario y adjunta el voucher para registrar y aprobar el pago.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <TreasuryRegisterPaymentForm profile={profile} />
            </CardContent>
        </Card>
    </div>
  );
}


export default function TreasuryStudentPaymentPage() {
    return (
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <TreasuryStudentPaymentPageContent />
        </Suspense>
    );
}

