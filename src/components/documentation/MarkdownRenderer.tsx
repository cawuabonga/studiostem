
"use client";

import React, { useEffect } from 'react';
import mermaid from 'mermaid';

// Unique ID for mermaid container
const MERMAID_ID = 'mermaid-container';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
    
    // Find all mermaid code blocks and render them
    const mermaidElements = document.querySelectorAll('.language-mermaid');
    mermaidElements.forEach((element, index) => {
      const id = `mermaid-chart-${index}`;
      try {
        const svgCode = mermaid.render(id, element.textContent || '');
        const newDiv = document.createElement('div');
        newDiv.innerHTML = svgCode;
        newDiv.classList.add('flex', 'justify-center', 'py-4'); // Center the diagram
        element.parentNode?.replaceChild(newDiv, element);
      } catch (e) {
        console.error(`Error rendering mermaid diagram ${index}:`, e);
      }
    });

  }, [content]);

  // A simple way to render markdown-like content as HTML.
  // For a full markdown experience, a library like 'react-markdown' would be used.
  const createMarkup = (text: string) => {
    // Replace ```mermaid ... ``` with a div that our useEffect can find
    let processedText = text.replace(
      /```mermaid([\s\S]*?)```/g,
      '<pre class="language-mermaid" style="display:none;">$1</pre>'
    );
    // Basic replacements
    processedText = processedText
        .replace(/^# (.*$)/gmi, '<h1 class="text-3xl font-bold mt-6 mb-3">$1</h1>')
        .replace(/^## (.*$)/gmi, '<h2 class="text-2xl font-bold mt-5 mb-2 border-b pb-1">$1</h2>')
        .replace(/^### (.*$)/gmi, '<h3 class="text-xl font-semibold mt-4 mb-1">$1</h3>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-muted text-foreground px-1.5 py-1 rounded-md font-mono text-sm">$1</code>')
        .replace(/\n/g, '<br />');
        
    return { __html: processedText };
  };

  return (
    <article
      className="prose dark:prose-invert max-w-none text-base"
      dangerouslySetInnerHTML={createMarkup(content)}
    />
  );
}

