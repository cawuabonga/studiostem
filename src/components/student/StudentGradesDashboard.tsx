
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getEnrolledUnits, getAcademicRecordForStudent, getAchievementIndicators } from "@/config/firebase";
import type { EnrolledUnit, AcademicRecord, AchievementIndicator } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentUnitGradesCard } from "./StudentUnitGradesCard";
import { StudentGradesDetailView } from "./StudentGradesDetailView";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";

interface UnitWithGrades extends EnrolledUnit {
    record: AcademicRecord | null;
    indicators: AchievementIndicator[];
}

export function StudentGradesDashboard() {
  const { user, instituteId } = useAuth();
  const [unitsWithGrades, setUnitsWithGrades] = useState<UnitWithGrades[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<UnitWithGrades | null>(null);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear().toString();

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!instituteId || !user?.documentId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        const enrolledUnits = await getEnrolledUnits(instituteId, user.documentId);
        
        const unitsData = await Promise.all(enrolledUnits.map(async (unit) => {
            const record = await getAcademicRecordForStudent(instituteId, unit.id, user.documentId, currentYear, unit.period);
            const indicators = await getAchievementIndicators(instituteId, unit.id);
            return { ...unit, record, indicators: indicators.sort((a,b) => a.name.localeCompare(b.name)) };
        }));

        setUnitsWithGrades(unitsData);
      } catch (error) {
        console.error("Error fetching student grades data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [instituteId, user?.documentId, currentYear]);

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-56 w-full" />
        ))}
      </div>
    );
  }

  if (selectedUnit) {
    return (
        <div>
            <Button variant="ghost" onClick={() => setSelectedUnit(null)} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a mis unidades
            </Button>
            <StudentGradesDetailView unit={selectedUnit} />
        </div>
    );
  }

  return (
    <div>
        {unitsWithGrades.length > 0 ? (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {unitsWithGrades.map((unit) => (
                    <StudentUnitGradesCard 
                        key={unit.id} 
                        unit={unit} 
                        record={unit.record} 
                        onSelect={() => setSelectedUnit(unit)}
                    />
                ))}
            </div>
        ) : (
             <p className="text-center text-muted-foreground py-10">No tienes calificaciones registradas por el momento.</p>
        )}
    </div>
  );
}
