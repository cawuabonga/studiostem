
"use client";

import { useMemo } from "react";
import type { Teacher, UnitAssignment } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface TeacherScheduleViewProps {
  teacher: Teacher;
  assignments: UnitAssignment[];
  programAbbrMap: Map<string, string>;
}

export function TeacherScheduleView({ teacher, assignments, programAbbrMap }: TeacherScheduleViewProps) {
  
  const assignmentsByPeriod = useMemo(() => {
    const marJul = assignments.filter(a => a.period === 'MAR-JUL');
    const agosDic = assignments.filter(a => a.period === 'AGOS-DIC');
    return { 'MAR-JUL': marJul, 'AGOS-DIC': agosDic };
  }, [assignments]);
  
  const totalHoursMarJul = useMemo(() => {
    return assignmentsByPeriod['MAR-JUL'].reduce((sum, a) => sum + (a.totalHours || 0), 0);
  }, [assignmentsByPeriod]);

  const totalHoursAgosDic = useMemo(() => {
    return assignmentsByPeriod['AGOS-DIC'].reduce((sum, a) => sum + (a.totalHours || 0), 0);
  }, [assignmentsByPeriod]);

  const getHourColorClass = (hours: number) => {
    if (hours > 21) return 'text-destructive';
    if (hours >= 18) return 'text-green-600';
    return 'text-muted-foreground';
  };

  return (
    <Card className="flex flex-col h-full shadow-none border-0">
      <CardHeader className="flex flex-row items-center gap-4 px-0 pt-0">
        <Avatar className="w-16 h-16">
          <AvatarImage src={`https://placehold.co/100x100.png?text=${teacher.fullName?.[0] || 'T'}`} alt={teacher.fullName} data-ai-hint="teacher profile" />
          <AvatarFallback>{teacher.fullName?.[0] || 'T'}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-xl">{teacher.fullName}</CardTitle>
          <CardDescription>DNI: {teacher.dni} | {teacher.studyProgram}</CardDescription>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4 md:space-y-0 md:flex md:gap-6 mt-6 p-0">
        
        {/* Periodo MAR-JUL */}
        <div className="md:w-1/2">
          <h4 className="font-semibold text-lg mb-2 pb-2 border-b">Periodo: MAR-JUL</h4>
          {assignmentsByPeriod['MAR-JUL'].length > 0 ? (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {assignmentsByPeriod['MAR-JUL'].map(a => (
                <li key={a.id} className="p-2 rounded-md bg-muted/50">
                  <span className="font-medium text-foreground">{a.unitName}</span> {a.shift && `(${a.shift})`}
                  <span className="text-muted-foreground italic ml-1">({programAbbrMap.get(a.studyProgram) || 'N/A'}) - {a.totalHours} hrs</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic py-4">Sin unidades asignadas para este período.</p>
          )}
        </div>

        {/* Periodo AGOS-DIC */}
        <div className="md:w-1/2">
          <h4 className="font-semibold text-lg mb-2 pb-2 border-b">Periodo: AGOS-DIC</h4>
           {assignmentsByPeriod['AGOS-DIC'].length > 0 ? (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {assignmentsByPeriod['AGOS-DIC'].map(a => (
                 <li key={a.id} className="p-2 rounded-md bg-muted/50">
                  <span className="font-medium text-foreground">{a.unitName}</span> {a.shift && `(${a.shift})`}
                  <span className="text-muted-foreground italic ml-1">({programAbbrMap.get(a.studyProgram) || 'N/A'}) - {a.totalHours} hrs</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground italic py-4">Sin unidades asignadas para este período.</p>
          )}
        </div>
      </CardContent>

      <CardFooter className="bg-muted/50 p-4 mt-6 flex justify-around text-center rounded-lg">
        <div>
          <p className="text-xs font-bold text-muted-foreground">HORAS MAR-JUL</p>
          <p className={cn("text-2xl font-bold", getHourColorClass(totalHoursMarJul))}>{totalHoursMarJul}</p>
        </div>
        <Separator orientation="vertical" className="h-10" />
        <div>
          <p className="text-xs font-bold text-muted-foreground">HORAS AGO-DIC</p>
          <p className={cn("text-2xl font-bold", getHourColorClass(totalHoursAgosDic))}>{totalHoursAgosDic}</p>
        </div>
        <Separator orientation="vertical" className="h-10" />
        <div>
          <p className="text-xs font-bold text-muted-foreground">TOTAL ANUAL</p>
          <p className="text-2xl font-bold text-accent-foreground">{totalHoursMarJul + totalHoursAgosDic}</p>
        </div>
      </CardFooter>
    </Card>
  );
}
