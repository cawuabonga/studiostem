
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getEnrolledUnits } from "@/config/firebase";
import type { EnrolledUnit } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpen } from "lucide-react";
import { StudentUnitCard } from "@/components/student/StudentUnitCard";

export default function MisUnidadesPage() {
  const { user, instituteId } = useAuth();
  const [enrolledUnits, setEnrolledUnits] = useState<EnrolledUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUnits = async () => {
      if (instituteId && user?.documentId) {
        try {
          const units = await getEnrolledUnits(instituteId, user.documentId);
          // TODO: Filter by current academic period
          setEnrolledUnits(units);
        } catch (error) {
          console.error("Error fetching enrolled units:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUnits();
  }, [instituteId, user?.documentId]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mis Unidades Didácticas</CardTitle>
          <CardDescription>
            Aquí encontrarás todas las unidades en las que estás matriculado. Selecciona una para ver el contenido del curso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : enrolledUnits.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {enrolledUnits.map((unit) => (
                <StudentUnitCard key={unit.id} unit={unit} />
              ))}
            </div>
          ) : (
            <Alert>
              <BookOpen className="h-4 w-4" />
              <AlertTitle>No estás matriculado en ninguna unidad</AlertTitle>
              <AlertDescription>
                Cuando te matricules en un período académico, tus unidades didácticas aparecerán aquí.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
