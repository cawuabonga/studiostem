
import React from 'react';
import { getInstitute, getPrograms } from '@/config/firebase';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, GraduationCap, Mail, Phone, MapPin } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

export const revalidate = 60; // Revalidate every 60 seconds

async function getInstituteData(instituteId: string) {
    try {
        const [institute, programs] = await Promise.all([
            getInstitute(instituteId),
            getPrograms(instituteId),
        ]);
        
        if (!institute) {
            return null;
        }

        return { institute, programs };
    } catch (error) {
        console.error("Error fetching institute page data:", error);
        return null;
    }
}

export default async function InstitutePublicPage({ params }: { params: { instituteId: string } }) {
    const data = await getInstituteData(params.instituteId);

    if (!data) {
        notFound();
    }

    const { institute, programs } = data;
    const profile = institute.publicProfile;

    return (
        <div className="bg-muted min-h-screen">
            <header className="relative h-64 md:h-80 w-full">
                {profile?.bannerUrl ? (
                    <Image
                        src={profile.bannerUrl}
                        alt={`Banner de ${institute.name}`}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center">
                        <Building className="h-24 w-24 text-primary-foreground/50"/>
                    </div>
                )}
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                    {institute.logoUrl && (
                        <Image
                            src={institute.logoUrl}
                            alt={`Logo de ${institute.name}`}
                            width={100}
                            height={100}
                            className="rounded-full bg-white p-2 shadow-lg mb-4"
                        />
                    )}
                    <h1 className="text-4xl md:text-5xl font-bold font-headline drop-shadow-md">{institute.name}</h1>
                    {profile?.slogan && <p className="mt-2 text-lg md:text-xl drop-shadow-sm">{profile.slogan}</p>}
                </div>
            </header>
            
            <main className="container mx-auto -mt-16 p-4 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {profile?.aboutUs && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Sobre Nosotros</CardTitle>
                                </CardHeader>
                                <CardContent className="prose prose-sm max-w-none text-muted-foreground">
                                    <p>{profile.aboutUs.replace(/\n/g, "<br/>")}</p>
                                </CardContent>
                            </Card>
                        )}
                        
                        <Card>
                            <CardHeader>
                                <CardTitle>Nuestros Programas de Estudio</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {programs.length > 0 ? (
                                    programs.map(program => (
                                        <div key={program.id} className="p-4 border rounded-lg bg-background">
                                            <h3 className="font-semibold">{program.name}</h3>
                                            <p className="text-sm text-muted-foreground">Duración: {program.duration}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground">No hay programas de estudio disponibles en este momento.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1 space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Contacto</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                {profile?.contactAddress && (
                                     <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                                        <span>{profile.contactAddress}</span>
                                    </div>
                                )}
                                {profile?.contactPhone && (
                                     <div className="flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-primary" />
                                        <span>{profile.contactPhone}</span>
                                    </div>
                                )}
                                {profile?.contactEmail && (
                                     <div className="flex items-center gap-3">
                                        <Mail className="h-5 w-5 text-primary" />
                                        <a href={`mailto:${profile.contactEmail}`} className="hover:underline">{profile.contactEmail}</a>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Generate static paths for existing institutes
export async function generateStaticParams() {
    const institutes = await getInstitutes();
    return institutes.map(institute => ({
        instituteId: institute.id,
    }));
}
