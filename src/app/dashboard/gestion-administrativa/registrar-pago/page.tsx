
"use client";

import { RegisterPaymentForm } from "@/components/payments/RegisterPaymentForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPaymentPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar Nuevo Pago</CardTitle>
        <CardDescription>
          Completa el formulario y adjunta una imagen clara de tu voucher de pago para que sea validado por tesorería.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterPaymentForm />
      </CardContent>
    </Card>
  );
}
