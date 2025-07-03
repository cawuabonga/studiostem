
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Teacher, UnitAssignment } from "@/types";
import { BookOpen } from "lucide-react";

interface TeacherReportCardProps {
  teacher: Teacher;
  assignmentsMarJul: UnitAssignment[];
  assignmentsAgosDic: UnitAssignment[];
  totalHoursMarJul: number;
  totalHoursAgosDic: number;
}

export function TeacherReportCard({
  teacher,
  assignmentsMarJul,
  assignmentsAgosDic,
  totalHoursMarJul,
  totalHoursAgosDic,
}: TeacherReportCardProps) {

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="w-16 h-16">
          <AvatarImage src={`https://placehold.co/100x100.png?text=${teacher.fullName?.[0] || 'T'}`} alt={teacher.fullName} data-ai-hint="teacher profile" />
          <AvatarFallback>{teacher.fullName?.[0] || 'T'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-xl">{teacher.fullName}</CardTitle>
          <CardDescription>DNI: {teacher.dni} | {teacher.studyProgram}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {/* Periodo MAR-JUL */}
        <div>
          <h4 className="font-semibold text-sm mb-2">Periodo: MAR-JUL</h4>
          {assignmentsMarJul.length > 0 ? (
            <ul className="space-y-1 text-xs list-disc list-inside text-muted-foreground">
              {assignmentsMarJul.map(a => (
                <li key={a.id}>
                  {a.unitName}
                  <span className="text-muted-foreground italic ml-1">({a.studyProgram})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground italic">Sin unidades asignadas.</p>
          )}
        </div>

        <Separator />

        {/* Periodo AGOS-DIC */}
        <div>
          <h4 className="font-semibold text-sm mb-2">Periodo: AGOS-DIC</h4>
           {assignmentsAgosDic.length > 0 ? (
            <ul className="space-y-1 text-xs list-disc list-inside text-muted-foreground">
              {assignmentsAgosDic.map(a => (
                 <li key={a.id}>
                  {a.unitName}
                  <span className="text-muted-foreground italic ml-1">({a.studyProgram})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground italic">Sin unidades asignadas.</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 p-4 flex justify-around text-center rounded-b-lg">
        <div>
          <p className="text-xs font-bold text-muted-foreground">HORAS MAR-JUL</p>
          <p className="text-lg font-bold text-primary">{totalHoursMarJul}</p>
        </div>
        <Separator orientation="vertical" className="h-10" />
        <div>
          <p className="text-xs font-bold text-muted-foreground">HORAS AGO-DIC</p>
          <p className="text-lg font-bold text-primary">{totalHoursAgosDic}</p>
        </div>
        <Separator orientation="vertical" className="h-10" />
        <div>
          <p className="text-xs font-bold text-muted-foreground">TOTAL ANUAL</p>
          <p className="text-lg font-bold text-accent-foreground">{totalHoursMarJul + totalHoursAgosDic}</p>
        </div>
      </CardFooter>
    </Card>
  );
}
