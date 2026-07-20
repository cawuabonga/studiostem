"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Sparkles, Send, Loader2, User, Bot, Rocket, Info, Cpu, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Unit, Project } from '@/types';
import { Input } from '../ui/input';
import { mentorProject } from '@/ai/flows/project-mentor-flow';
import { Badge } from '../ui/badge';

interface ProjectMentorProps {
    unit: Unit;
    project: Project | null;
}

export function ProjectMentor({ unit, project }: ProjectMentorProps) {
    const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string, provider?: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeProviderName, setActiveProviderName] = useState<string>('Detectando...');

    useEffect(() => {
        setMessages([
            { 
                role: 'bot', 
                text: project 
                    ? `Hola, soy tu mentor para el proyecto "${project.title}". ¿En qué puedo ayudarte hoy?` 
                    : "El docente aún no ha definido los detalles del proyecto. ¡Pronto estaré disponible para guiarte!" 
            }
        ]);
    }, [project]);

    const handleSend = async () => {
        if (!input.trim() || !project) return;
        
        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setLoading(true);

        try {
            const response = await mentorProject({
                projectTitle: project.title || 'Proyecto sin título',
                objective: project.objective || 'Información no proporcionada.',
                competencies: project.competencies || 'Información no proporcionada.',
                rubrics: project.rubrics?.length > 0 
                    ? project.rubrics.map(r => `${r.label}: ${r.description}`).join(' | ')
                    : 'Rúbricas no definidas.',
                userInput: userMsg
            });

            setActiveProviderName(response.provider);
            setMessages(prev => [...prev, { 
                role: 'bot', 
                text: response.text,
                provider: response.provider 
            }]);
        } catch (error: any) {
            console.error("[DEBUG] Chat Error:", error);
            setMessages(prev => [...prev, { 
                role: 'bot', 
                text: "Error: El motor de IA configurado por el administrador no está respondiendo. Por favor, contacte a soporte técnico." 
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="h-[700px] flex flex-col border-none shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-b from-slate-50 to-white">
            <CardHeader className="bg-primary p-6 text-primary-foreground shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                            <Sparkles className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black uppercase tracking-tight">Mentor STEM</CardTitle>
                            <CardDescription className="text-primary-foreground/70 text-xs font-bold uppercase tracking-widest">Guía ABP Especializada</CardDescription>
                        </div>
                    </div>
                    {/* SEÑAL DE IA ACTIVA */}
                    <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="bg-white/10 border-white/20 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1">
                            {activeProviderName.includes('Ollama') ? <Cpu className="h-3 w-3 mr-1.5 text-orange-400" /> : <Globe className="h-3 w-3 mr-1.5 text-blue-400" />}
                            Motor: {activeProviderName}
                        </Badge>
                        <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">Respetando Config. SuperAdmin</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6 pb-4">
                        {messages.map((m, i) => (
                            <div key={i} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm", m.role === 'user' ? "bg-primary text-white" : "bg-accent text-accent-foreground")}>
                                    {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>
                                <div className="space-y-1 max-w-[85%]">
                                    <div className={cn(
                                        "p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm animate-in fade-in slide-in-from-bottom-2",
                                        m.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-white border rounded-tl-none text-slate-700"
                                    )}>
                                        {m.text}
                                    </div>
                                    {m.provider && (
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase px-2">Generado por {m.provider}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-3 animate-pulse">
                                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-accent-foreground" /></div>
                                <div className="p-4 bg-muted rounded-2xl rounded-tl-none w-20"></div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-6 bg-slate-100/50 border-t border-slate-200">
                    <div className="flex gap-2">
                        <Input 
                            placeholder={project ? "Hazle una pregunta a tu mentor..." : "Mentor desactivado..."} 
                            value={input} 
                            onChange={e => setInput(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            disabled={loading || !project}
                            className="bg-white rounded-xl h-12 shadow-inner border-none focus-visible:ring-primary"
                        />
                        <Button onClick={handleSend} disabled={loading || !project || !input.trim()} size="icon" className="h-12 w-12 rounded-xl shadow-lg">
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                    </div>
                    {project && (
                        <div className="mt-4 flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground tracking-widest justify-center">
                            <Info className="h-3 w-3" /> Proyecto: {project.title}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
