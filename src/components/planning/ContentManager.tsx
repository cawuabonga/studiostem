
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getContentsForWeek } from '@/config/firebase';
import type { Content, Unit } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { AddContentForm } from './AddContentForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { FileText, Link, Type } from 'lucide-react';

interface ContentManagerProps {
  unit: Unit;
  weekNumber: number;
}

const getIconForType = (type: Content['type']) => {
    switch(type) {
        case 'file': return <FileText className="h-5 w-5" />;
        case 'link': return <Link className="h-5 w-5" />;
        case 'text': return <Type className="h-5 w-5" />;
        default: return <FileText className="h-5 w-5" />;
    }
}


export function ContentManager({ unit, weekNumber }: ContentManagerProps) {
  const { instituteId } = useAuth();
  const { toast } = useToast();
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const fetchContents = useCallback(async () => {
    if (!instituteId) return;
    setLoading(true);
    try {
      const fetchedContents = await getContentsForWeek(instituteId, unit.id, weekNumber);
      setContents(fetchedContents);
    } catch (error) {
      console.error(`Error fetching contents for week ${weekNumber}:`, error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los contenidos de la semana.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [instituteId, unit.id, weekNumber, toast]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents, version]);

  const handleContentAdded = () => {
    setVersion(v => v + 1);
  };
  
  return (
    <Card className="bg-muted/50">
        <CardHeader>
            <CardTitle className="text-lg">Contenidos de la Semana</CardTitle>
            <CardDescription>Añada recursos como archivos, enlaces o texto para esta semana.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {loading ? (
                <Skeleton className="h-16 w-full" />
            ) : contents.length > 0 ? (
                <div className="space-y-2">
                    {contents.map(content => (
                        <div key={content.id} className="flex items-center justify-between rounded-md border bg-background p-3">
                           <div className="flex items-center gap-3">
                             {getIconForType(content.type)}
                             <a 
                                href={content.type === 'link' ? content.value : undefined} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="font-medium hover:underline"
                            >
                                {content.title}
                            </a>
                           </div>
                           {/* TODO: Add edit/delete buttons */}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                    Aún no hay contenidos para esta semana.
                </p>
            )}

            <AddContentForm 
                unit={unit}
                weekNumber={weekNumber}
                onContentAdded={handleContentAdded}
            />
        </CardContent>
    </Card>
  );
}
