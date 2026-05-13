
"use client";

import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const createMarkup = (text: string) => {
    let processedText = text
        // Títulos de Sección (I, II, III...) - Estilo Sílabo
        .replace(/^# (.*$)/gmi, '<h1 class="text-xl font-black mt-4 mb-6 bg-gray-100 p-3 border-y-2 border-black uppercase tracking-widest flex items-center gap-3"><span class="bg-black text-white px-3 py-1 text-sm">DOC</span> $1</h1>')
        // Subtítulos
        .replace(/^## (.*$)/gmi, '<h2 class="text-lg font-black mt-8 mb-4 text-black border-l-[6px] border-black pl-4 uppercase tracking-tighter">$1</h2>')
        .replace(/^### (.*$)/gmi, '<h3 class="text-base font-bold mt-6 mb-3 text-gray-800 underline decoration-2 underline-offset-4">$1</h3>')
        // Énfasis
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-black">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic text-gray-600">$1</em>')
        // Código e Inline
        .replace(/`([^`]+)`/g, '<code class="bg-gray-50 text-black px-2 py-0.5 rounded font-mono text-xs border border-gray-200">$1</code>')
        // Listas
        .replace(/^\* (.*$)/gmi, '<li class="ml-6 mb-1.5 list-disc text-gray-800 font-medium">$1</li>')
        // Jerarquía de Datos (Cards)
        .replace(/↳ (.*$)/gmi, '<div class="ml-10 mb-3 p-4 bg-gray-50/50 rounded-r-lg border-l-4 border-gray-300 font-bold text-sm text-gray-700 shadow-sm">↳ $1</div>')
        .replace(/\n/g, '<br />');
        
    return { __html: processedText };
  };

  return (
    <article
      className="prose dark:prose-invert max-w-none text-[10pt] leading-relaxed print:text-[9.5pt]"
      dangerouslySetInnerHTML={createMarkup(content)}
    />
  );
}

