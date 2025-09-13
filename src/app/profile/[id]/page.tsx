
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { getInstitutes, getStaffProfileByDocumentId, getStudentProfile, getUnits, getAssignments, getPrograms, listenToAccessLogsForUser } from '@/config/firebase';
import type { StaffProfile, StudentProfile, Unit, Program, EnrolledUnit, AccessLog } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Building, BookOpen, Briefcase, GraduationCap, Share2 } from 'lucide-react';
import { CareerProgressTimeline } from '@/components/student/CareerProgressTimeline';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ProfileAccessLogs } from '@/components/profile/ProfileAccessLogs';


interface ProfileData {
    type: 'staff' | 'student';
    profile: StaffProfile | StudentProfile;
    instituteName: string;
    programName: string;
    assignedUnits?: Unit[];
}

const LoadingState = () => (
    <div className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
        </div>
        <div className="mt-8 space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
        </div>
    </div>
);

const StaffProfileView = ({ profile, instituteName, programName, assignedUnits }: { profile: StaffProfile; instituteName: string; programName: string; assignedUnits?: Unit[] }) => (
    <>
        <div className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg text-muted-foreground">{profile.role}</span>
        </div>
        <div className="flex items-center space-x-2">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg text-muted-foreground">{programName}</span>
        </div>
        <div className="mt-8 w-full max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle>Unidades Didácticas Asignadas</CardTitle>
                </CardHeader>
                <CardContent>
                    {assignedUnits && assignedUnits.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {assignedUnits.map(unit => (
                                <div key={unit.id} className="p-4 border rounded-lg bg-background">
                                    <h3 className="font-semibold">{unit.name}</h3>
                                    <p className="text-sm text-muted-foreground">{unit.period} - {unit.totalHours} horas</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center">Este docente no tiene unidades asignadas actualmente.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    </>
);

const StudentProfileView = ({ profile, instituteName, programName }: { profile: StudentProfile; instituteName: string; programName: string; }) => {
    // We need to provide a mock user object to CareerProgressTimeline
    const mockUser = {
        uid: profile.linkedUserUid || '',
        displayName: profile.fullName,
        email: profile.email,
        photoURL: profile.photoURL || null,
        role: 'Student',
        documentId: profile.documentId,
        instituteId: '', // instituteId will be taken from AuthContext
    };

    return (
        <div className="w-full max-w-4xl mt-8">
            <div className="flex items-center space-x-2 mb-4 justify-center">
                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg text-muted-foreground">{programName}</span>
            </div>
            <CareerProgressTimeline />
        </div>
    );
};


export default function PublicProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const pathname = usePathname();
  const { setInstitute, instituteId } = useAuth();
  
  const id = pathname.split('/').pop();

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        toast({
            title: "¡Enlace copiado!",
            description: "El enlace al perfil ha sido copiado al portapapeles.",
        })
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        toast({
            title: "Error",
            description: "No se pudo copiar el enlace.",
            variant: "destructive"
        })
    });
  };

  useEffect(() => {
    let unsubscribe: () => void = () => {};
    const fetchProfile = async () => {
      if (!id) {
        setError("No se ha especificado un perfil.");
        setLoading(false);
        setLoadingLogs(false);
        return;
      }

      setLoading(true);
      setLoadingLogs(true);
      try {
        const institutes = await getInstitutes();
        let foundProfile: ProfileData | null = null;
        let foundInstituteId: string | null = null;

        for (const institute of institutes) {
          const staffProfile = await getStaffProfileByDocumentId(institute.id, id);
          if (staffProfile) {
            foundInstituteId = institute.id;
            const programs = await getPrograms(institute.id);
            const program = programs.find(p => p.id === staffProfile.programId);
            
            const allUnits = await getUnits(institute.id);
            const currentYear = new Date().getFullYear().toString();
            const assignments = await getAssignments(institute.id, currentYear, staffProfile.programId);
            
            const assignedUnits = allUnits.filter(unit => 
                (assignments['MAR-JUL']?.[unit.id] === id || assignments['AGO-DIC']?.[unit.id] === id)
            );

            foundProfile = {
              type: 'staff',
              profile: staffProfile,
              instituteName: institute.name,
              programName: program?.name || 'N/A',
              assignedUnits: assignedUnits,
            };
            break;
          }

          const studentProfile = await getStudentProfile(institute.id, id);
          if (studentProfile) {
            foundInstituteId = institute.id;
            const programs = await getPrograms(institute.id);
            const program = programs.find(p => p.id === studentProfile.programId);
            foundProfile = {
              type: 'student',
              profile: studentProfile,
              instituteName: institute.name,
              programName: program?.name || 'N/A',
            };
            break;
          }
        }

        if (foundProfile && foundInstituteId) {
          setProfileData(foundProfile);
          await setInstitute(foundInstituteId);
          
          unsubscribe = listenToAccessLogsForUser(foundInstituteId, id, (newLogs) => {
              setAccessLogs(newLogs);
              if(loadingLogs) setLoadingLogs(false);
          });
        } else {
          setError("Perfil no encontrado.");
          setLoadingLogs(false);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Ocurrió un error al cargar el perfil.");
        setLoadingLogs(false);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    return () => unsubscribe();
  }, [id, setInstitute, loadingLogs]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <div className="text-center text-destructive p-8">{error}</div>;
  }

  if (!profileData) {
    return <div className="text-center p-8">Perfil no disponible.</div>;
  }
  
  const { profile, type, instituteName, programName, assignedUnits } = profileData;
  const displayName = 'displayName' in profile ? profile.displayName : profile.fullName;
  const photoURL = profile.photoURL || `https://placehold.co/128x128.png?text=${displayName[0]}`;


  return (
    <div className="bg-muted min-h-screen">
        <div className="container mx-auto p-4 md:p-8">
            <div className="bg-card p-8 rounded-lg shadow-lg flex flex-col items-center relative">
                 <Button 
                    variant="outline"
                    size="sm"
                    className="absolute top-4 right-4"
                    onClick={handleCopyLink}
                 >
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartir Perfil
                 </Button>

                 <Avatar className="w-32 h-32 mb-4 border-4 border-primary">
                    <AvatarImage src={photoURL} alt={`Foto de ${displayName}`} data-ai-hint="profile avatar" />
                    <AvatarFallback className="text-5xl">{displayName ? displayName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                </Avatar>
                <h1 className="text-4xl font-bold font-headline">{displayName}</h1>
                <div className="flex items-center space-x-2 mt-2">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-xl text-muted-foreground">{instituteName}</h2>
                </div>
                
                 {type === 'staff' && <StaffProfileView profile={profile as StaffProfile} instituteName={instituteName} programName={programName} assignedUnits={assignedUnits} />}
                 {type === 'student' && instituteId && <StudentProfileView profile={profile as StudentProfile} instituteName={instituteName} programName={programName} />}

            </div>
            
            <ProfileAccessLogs logs={accessLogs} loading={loadingLogs} />

        </div>
    </div>
  );
}
