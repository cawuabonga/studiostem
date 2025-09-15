
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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
      <Card>
        <CardHeader>
          <CardTitle>Documentación del Proyecto</CardTitle>
          <CardDescription>
            Recursos técnicos, guías y descripciones sobre la arquitectura y funcionamiento del proyecto STEM.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {pages.length > 0 ? (
            pages.map((page) => (
                <Link href={`/dashboard/superadmin/documentation/${page.slug}`} key={page.slug}>
                    <Card className="h-full flex flex-col hover:border-primary hover:shadow-lg transition-all">
                        <CardHeader>
                            <CardTitle>{page.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-muted-foreground">{page.description}</p>
                        </CardContent>
                        <CardContent>
                            <div className="flex items-center text-primary font-semibold">
                                Leer más <ArrowRight className="ml-2 h-4 w-4" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))
        ) : (
            <p className="text-muted-foreground col-span-full text-center py-8">
                No se encontraron documentos.
            </p>
        )}
      </div>
    </div>
  );
}
