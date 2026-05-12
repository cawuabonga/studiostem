
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { ArrowRight, Printer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocMetadata {
  slug: string;
  title: string;
  description: string;
}

async function getDocumentationPages(): Promise<DocMetadata[]> {
  const docsDirectory = path.join(process.cwd(), 'src/documentation');
  try {
    const filenames = await fs.readdir(docsDirectory);
    
    const docs = await Promise.all(
      filenames.map(async (filename) => {
        const filePath = path.join(docsDirectory, filename);
        const fileContents = await fs.readFile(filePath, 'utf8');
        const { data } = matter(fileContents);
        return {
          slug: filename.replace(/\.md$/, ''),
          title: data.title || 'Sin Título',
          description: data.description || 'Sin descripción.',
        };
      })
    );
    
    return docs;
  } catch (error) {
    console.error("Could not read documentation directory:", error);
    return [];
  }
}

export default async function DocumentationIndexPage() {
  const pages = await getDocumentationPages();

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardHeader className="bg-primary/5 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Documentación del Proyecto</CardTitle>
              <CardDescription className="text-base">
                Recursos técnicos, guías y descripciones sobre la arquitectura y funcionamiento del proyecto STEM.
              </CardDescription>
            </div>
            <Button asChild className="shadow-lg">
                <Link href="/dashboard/superadmin/documentation/print" target="_blank">
                    <Printer className="mr-2 h-4 w-4" />
                    Generar Manual Técnico (PDF)
                </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pages.length > 0 ? (
            pages.map((page) => (
                <Link href={`/dashboard/superadmin/documentation/${page.slug}`} key={page.slug}>
                    <Card className="h-full flex flex-col hover:border-primary hover:shadow-xl transition-all group border-primary/5">
                        <CardHeader>
                            <div className="p-2 bg-primary/5 w-fit rounded-lg mb-2 group-hover:bg-primary/10 transition-colors">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="text-lg group-hover:text-primary transition-colors">{page.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground leading-relaxed">{page.description}</p>
                        </CardContent>
                        <CardContent className="pt-0">
                            <div className="flex items-center text-primary font-bold text-xs uppercase tracking-widest">
                                Leer documento <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))
        ) : (
            <p className="text-muted-foreground col-span-full text-center py-12 italic border-2 border-dashed rounded-xl">
                No se encontraron documentos en la carpeta de origen.
            </p>
        )}
      </div>
    </div>
  );
}
