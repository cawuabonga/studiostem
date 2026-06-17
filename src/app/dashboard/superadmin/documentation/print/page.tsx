
import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { DocumentationPrintLayout } from '@/components/documentation/DocumentationPrintLayout';

async function getFullManualContent() {
  const docsDirectory = path.join(process.cwd(), 'src/documentation');
  try {
    const filenames = await fs.readdir(docsDirectory);
    
    const docs = await Promise.all(
      filenames.map(async (filename) => {
        const filePath = path.join(docsDirectory, filename);
        const fileContents = await fs.readFile(filePath, 'utf8');
        const { data, content } = matter(fileContents);
        return {
          slug: filename.replace(/\.md$/, ''),
          title: data.title || 'Sin Título',
          content,
        };
      })
    );
    
    // Orden lógico de las secciones
    const order = ['arquitectura', 'eficiencia-datos', 'tecnologias', 'identidad-acceso', 'integracion-iot'];
    return docs.sort((a, b) => {
        const idxA = order.indexOf(a.slug);
        const idxB = order.indexOf(b.slug);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        return a.title.localeCompare(b.title);
    });
  } catch (error) {
    console.error("Error reading docs for print:", error);
    return [];
  }
}

export default async function FullManualPrintPage() {
  const allDocs = await getFullManualContent();

  return (
    <div className="bg-white">
      {/* El componente DocumentationPrintLayout ahora maneja su propia carga y disparo de window.print() */}
      <DocumentationPrintLayout documents={allDocs} />
    </div>
  );
}
