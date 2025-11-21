

import React from 'react';
import { getInstitute, getPrograms, getInstitutes, getNewsList } from '@/config/firebase';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, GraduationCap, Mail, Phone, MapPin, Newspaper, BookOpen, ArrowRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { hslToHex } from '@/lib/utils';


export const revalidate = 60; // Revalidate every 60 seconds

async function getInstituteData(instituteId: string) {
    try {
        const [institute, programs, news] = await Promise.all([
            getInstitute(instituteId),
            getPrograms(instituteId),
            getNewsList(instituteId),
        ]);
        
        if (!institute) {
            return null;
        }

        return { institute, programs, news: news.slice(0, 3) }; // Return only the 3 latest news
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

    const { institute, programs, news } = data;
    const profile = institute.publicProfile;
    const primaryColor = institute.primaryColor ? hslToHex(institute.primaryColor) : '#1E3A8A';

    return (
        <div className="bg-background text-foreground">
             <style jsx global>{`
                :root {
                --institute-primary: ${primaryColor};
                }
            `}</style>
            
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
                <nav className="container mx-auto flex justify-between items-center p-4">
                    <Link href={`/institute/${institute.id}`} className="flex items-center gap-2 font-bold text-lg">
                         {institute.logoUrl && (
                            <Image
                                src={institute.logoUrl}
                                alt={`Logo de ${institute.name}`}
                                width={40}
                                height={40}
                                className="rounded-full bg-white p-1 object-contain"
                            />
                        )}
                        <span className="hidden sm:inline">{institute.name}</span>
                    </Link>
                    <div className="hidden md:flex gap-6 items-center text-sm font-medium">
                        <Link href="#about" className="hover:text-primary transition-colors">Nosotros</Link>
                        <Link href="#programs" className="hover:text-primary transition-colors">Carreras</Link>
                        <Link href="#news" className="hover:text-primary transition-colors">Noticias</Link>
                        <Link href="#contact" className="hover:text-primary transition-colors">
                             <Button size="sm">Contacto</Button>
                        </Link>
                    </div>
                </nav>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative h-[60vh] min-h-[400px] w-full flex items-center justify-center text-center text-white p-4">
                     {profile?.bannerUrl ? (
                        <Image
                            src={profile.bannerUrl}
                            alt={`Banner de ${institute.name}`}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="absolute inset-0 bg-primary" />
                    )}
                    <div className="absolute inset-0 bg-black/60" />
                    <div className="relative z-10 max-w-4xl">
                        <h1 className="text-4xl md:text-6xl font-bold font-headline drop-shadow-lg">{institute.name}</h1>
                        {profile?.slogan && <p className="mt-4 text-lg md:text-2xl drop-shadow-md">{profile.slogan}</p>}
                    </div>
                </section>

                 {/* About Us Section */}
                {profile?.aboutUs && (
                    <section id="about" className="py-16 lg:py-24">
                        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16 items-center">
                            <div className="prose prose-lg max-w-none">
                                <h2 className="text-3xl font-bold font-headline mb-4 text-primary" style={{color: primaryColor}}>
                                    Bienvenidos a {institute.name}
                                </h2>
                                <p className="text-muted-foreground">{profile.aboutUs.replace(/\n/g, "<br />")}</p>
                            </div>
                             <div className="relative h-64 md:h-80 rounded-lg overflow-hidden shadow-xl">
                                <Image 
                                    src="https://picsum.photos/seed/campus/800/600"
                                    alt="Campus del instituto"
                                    fill
                                    className="object-cover"
                                    data-ai-hint="university campus"
                                />
                            </div>
                        </div>
                    </section>
                )}
                
                <Separator />
                
                {/* Programs Section */}
                <section id="programs" className="py-16 lg:py-24 bg-muted">
                    <div className="container mx-auto">
                         <h2 className="text-3xl font-bold font-headline text-center mb-12">Nuestros Programas de Estudio</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                             {programs.length > 0 ? (
                                programs.map(program => (
                                    <Card key={program.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-300">
                                        <CardHeader>
                                            <div className="p-4 bg-primary rounded-md mb-4 flex justify-center items-center" style={{backgroundColor: primaryColor}}>
                                                <BookOpen className="h-10 w-10 text-primary-foreground"/>
                                            </div>
                                            <CardTitle>{program.name}</CardTitle>
                                            <CardDescription>Duración: {program.duration}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                Módulos: {program.modules.map(m => m.name).join(', ')}
                                            </p>
                                        </CardContent>
                                        <CardFooter>
                                            <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground" style={{'--primary': primaryColor} as React.CSSProperties}>
                                                Más Información <ArrowRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))
                            ) : (
                                <p className="col-span-full text-muted-foreground text-center py-8">No hay programas de estudio disponibles en este momento.</p>
                            )}
                        </div>
                    </div>
                </section>
                
                {/* News Section */}
                <section id="news" className="py-16 lg:py-24">
                     <div className="container mx-auto">
                        <h2 className="text-3xl font-bold font-headline text-center mb-12">Últimas Noticias y Eventos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                             {news.length > 0 ? (
                                news.map(item => (
                                    <Card key={item.id} className="flex flex-col group overflow-hidden hover:shadow-2xl transition-all duration-300">
                                         {item.imageUrl && (
                                            <div className="w-full h-48 relative shrink-0">
                                                 <Image src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                            </div>
                                        )}
                                        <CardHeader>
                                            <CardDescription>{format(item.createdAt.toDate(), 'dd MMMM, yyyy', { locale: es })}</CardDescription>
                                            <CardTitle className="leading-tight">{item.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-grow">
                                            <p className="text-sm text-muted-foreground line-clamp-3">{item.summary}</p>
                                        </CardContent>
                                        <CardFooter>
                                            <a href="#" className="font-semibold text-primary" style={{color: primaryColor}}>
                                                Leer más...
                                            </a>
                                        </CardFooter>
                                    </Card>
                                ))
                            ) : (
                                <p className="col-span-full text-muted-foreground text-center py-8">No hay noticias publicadas recientemente.</p>
                            )}
                        </div>
                     </div>
                </section>

            </main>
             
             {/* Footer */}
             <footer id="contact" className="bg-foreground text-background mt-12 py-12">
                <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg">{institute.name}</h3>
                        <p className="text-sm text-muted-foreground">{profile?.slogan}</p>
                    </div>
                     <div className="space-y-4">
                         <h3 className="font-bold text-lg">Contacto</h3>
                         <ul className="space-y-2 text-sm">
                             {profile?.contactAddress && (
                                 <li className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-primary shrink-0" style={{color: primaryColor}} />
                                    <span className="text-muted-foreground">{profile.contactAddress}</span>
                                </li>
                            )}
                            {profile?.contactPhone && (
                                 <li className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-primary" style={{color: primaryColor}} />
                                    <span className="text-muted-foreground">{profile.contactPhone}</span>
                                </li>
                            )}
                            {profile?.contactEmail && (
                                 <li className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-primary" style={{color: primaryColor}} />
                                    <a href={`mailto:${profile.contactEmail}`} className="hover:underline text-muted-foreground">{profile.contactEmail}</a>
                                </li>
                            )}
                         </ul>
                    </div>
                     <div className="space-y-4">
                         <h3 className="font-bold text-lg">Redes Sociales</h3>
                          <div className="flex gap-4">
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" style={{'--primary': primaryColor} as React.CSSProperties}>Facebook</a>
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" style={{'--primary': primaryColor} as React.CSSProperties}>Instagram</a>
                            <a href="#" className="text-muted-foreground hover:text-primary transition-colors" style={{'--primary': primaryColor} as React.CSSProperties}>YouTube</a>
                        </div>
                    </div>
                </div>
                <div className="container mx-auto text-center mt-8 border-t border-border pt-6">
                    <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} {institute.name}. Todos los derechos reservados.</p>
                </div>
            </footer>
        </div>
    );
}

// Generate static paths for existing institutes
export async function generateStaticParams() {
  try {
    const institutes = await getInstitutes();
    return institutes.map(institute => ({
      instituteId: institute.id,
    }));
  } catch (error) {
    console.error("Could not generate static params for institutes:", error);
    return [];
  }
}
