
"use client";

import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Simplificamos el renderizador eliminando Mermaid para evitar errores de sintaxis visuales
  // y mejorar la velocidad de carga de la documentación.

  const createMarkup = (text: string) => {
    let processedText = text
        .replace(/^# (.*$)/gmi, '<h1 class="text-3xl font-black mt-8 mb-4 text-primary uppercase tracking-tight border-b-2 pb-2">$1</h1>')
        .replace(/^## (.*$)/gmi, '<h2 class="text-2xl font-bold mt-8 mb-3 text-foreground/90 border-l-4 border-primary pl-4">$2</h2>')
        .replace(/^### (.*$)/gmi, '<h3 class="text-xl font-bold mt-6 mb-2 text-foreground/80">$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-primary/90">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic text-muted-foreground">$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-muted text-primary px-1.5 py-0.5 rounded font-mono text-sm border">$1</code>')
        .replace(/^\* (.*$)/gmi, '<li class="ml-4 mb-1 list-disc">$1</li>')
        .replace(/↳ (.*$)/gmi, '<div class="ml-8 mb-2 p-3 bg-muted/30 rounded-lg border-l-4 border-primary/20 font-medium">↳ $1</div>')
        .replace(/\n/g, '<br />');
        
    return { __html: processedText };
  };

  return (
    <article
      className="prose dark:prose-invert max-w-none text-base leading-relaxed"
      dangerouslySetInnerHTML={createMarkup(content)}
    />
  );
}
