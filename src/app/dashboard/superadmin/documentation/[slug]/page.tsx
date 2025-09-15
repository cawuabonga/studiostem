
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { MarkdownRenderer } from '@/components/documentation/MarkdownRenderer';

async function getDocumentContent(slug: string) {
  const docsDirectory = path.join(process.cwd(), 'src/documentation');
  const filePath = path.join(docsDirectory, `${slug}.md`);

  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    return {
      title: data.title || 'Sin Título',
      description: data.description || '',
      content,
      tags: data.tags || []
    };
  } catch (error) {
    return null;
  }
}

export default async function DocumentationPage({ params }: { params: { slug: string } }) {
  const doc = await getDocumentContent(params.slug);

  if (!doc) {
    return (
        <div className="text-center py-10">
            <h1 className="text-2xl font-bold">Documento no encontrado</h1>
            <p className="text-muted-foreground">No se pudo encontrar el documento que buscas.</p>
             <Button asChild variant="link" className="mt-4">
                <Link href="/dashboard/superadmin/documentation">Volver al índice</Link>
            </Button>
        </div>
    )
  }

  return (
    <div className="space-y-6">
        <Button asChild variant="ghost">
            <Link href="/dashboard/superadmin/documentation">
                <ArrowLeft className="mr-2 h-4 w-4"/>
                Volver a Documentación
            </Link>
        </Button>
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-bold">{doc.title}</CardTitle>
                <CardDescription>{doc.description}</CardDescription>
                {doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {doc.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <MarkdownRenderer content={doc.content} />
            </CardContent>
        </Card>
    </div>
  );
}
