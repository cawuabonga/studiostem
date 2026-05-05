"use client";

import React from 'react';
import type { Asset, Institute, Building, Environment } from '@/types';
import { format } from 'date-fns';
import { Archive, CheckCircle, Wrench, XCircle } from 'lucide-react';

interface PrintInventoryListProps {
    assets: Asset[];
    stats: {
        total: number;
        operative: number;
        maintenance: number;
        decommissioned: number;
    };
    institute: Institute | null;
    filters: {
        buildingFilter: string;
        environmentFilter: string;
        typeFilter: string;
        statusFilter: string;
        textFilter: string;
    };
    buildings: Building[];
    allEnvironments: Environment[];
}

const StatCardPrint = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <div className="border border-black p-2 rounded-md bg-gray-50 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
            <h3 className="text-[7pt] uppercase font-black text-gray-600">{title}</h3>
            <Icon className="h-3 w-3 text-gray-400" />
        </div>
        <div className="text-[14pt] font-black leading-none">{value}</div>
    </div>
);

export function PrintInventoryList({ assets, stats, institute, filters, buildings, allEnvironments }: PrintInventoryListProps) {
    const today = new Date();

    const getFilterDescription = () => {
        const descriptions = [];
        if(filters.buildingFilter !== 'all') {
            const buildingName = buildings.find(b => b.id === filters.buildingFilter)?.name || filters.buildingFilter;
            descriptions.push(`Edificio: ${buildingName}`);
        }
        if(filters.environmentFilter !== 'all') {
             const envName = allEnvironments.find(e => e.id === filters.environmentFilter)?.name || filters.environmentFilter;
            descriptions.push(`Ambiente: ${envName}`);
        }
        if(filters.typeFilter !== 'all') descriptions.push(`Tipo: ${filters.typeFilter}`);
        if(filters.statusFilter !== 'all') descriptions.push(`Estado: ${filters.statusFilter}`);
        if(filters.textFilter) descriptions.push(`Búsqueda: "${filters.textFilter}"`);
        
        return descriptions.length > 0 ? descriptions.join(' | ') : 'Inventario Completo';
    }

    return (
        <div className="printable-area p-4 font-sans text-black">
            <header className="print-header flex items-center justify-between mb-4 border-b-2 border-black pb-4">
                <div className="flex items-center gap-4">
                    {institute?.logoUrl && (
                        <img src={institute.logoUrl} alt="Logo" className="w-[60px] h-[60px] object-contain" />
                    )}
                    <div>
                        <h1 className="text-lg font-bold leading-tight">{institute?.name || 'Nombre del Instituto'}</h1>
                        <p className="text-[9pt] uppercase tracking-widest font-bold text-gray-600">Reporte Oficial de Inventario Patrimonial</p>
                    </div>
                </div>
                <div className="text-[8pt] text-right leading-tight">
                    <p className="font-bold">FECHA DE EMISIÓN:</p>
                    <p>{format(today, 'dd/MM/yyyy')}</p>
                    <p>{format(today, 'HH:mm')}</p>
                </div>
            </header>

            <div className="text-center my-6">
                <h2 className="text-xl font-black uppercase tracking-tighter border-y-2 border-black py-2">Resumen de Bienes Patrimoniales</h2>
                <p className="text-[8pt] text-gray-600 mt-2 font-medium">Filtros aplicados: {getFilterDescription()}</p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
                <StatCardPrint title="Total Activos" value={stats.total} icon={Archive} />
                <StatCardPrint title="Operativos" value={stats.operative} icon={CheckCircle} />
                <StatCardPrint title="Mantenimiento" value={stats.maintenance} icon={Wrench} />
                <StatCardPrint title="De Baja" value={stats.decommissioned} icon={XCircle} />
            </div>
            
            <table className="w-full border-collapse border border-black text-[7pt]">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-1 text-center w-[30px]">N°</th>
                        <th className="border border-black p-1 text-left">DENOMINACIÓN DEL BIEN</th>
                        <th className="border border-black p-1 text-left w-[100px]">CÓDIGO/SERIAL</th>
                        <th className="border border-black p-1 text-left w-[120px]">UBICACIÓN</th>
                        <th className="border border-black p-1 text-left w-[80px]">CLASE</th>
                        <th className="border border-black p-1 text-center w-[80px]">ESTADO</th>
                    </tr>
                </thead>
                <tbody>
                    {assets.map((asset, index) => (
                        <tr key={asset.id} className="h-auto">
                            <td className="border border-black p-1 text-center font-mono">{index + 1}</td>
                            <td className="border border-black p-1 font-bold uppercase leading-tight">{asset.name}</td>
                            <td className="border border-black p-1 font-mono text-[6pt]">{asset.codeOrSerial}</td>
                            <td className="border border-black p-1 text-[6pt] leading-tight">
                                {asset.buildingName} / {asset.environmentName}
                            </td>
                            <td className="border border-black p-1 uppercase">{asset.type}</td>
                            <td className="border border-black p-1 text-center">
                                <span className={cn(
                                    "font-black",
                                    asset.status === 'De Baja' ? "text-red-600" : 
                                    asset.status === 'En Mantenimiento' ? "text-orange-600" : "text-black"
                                )}>
                                    {asset.status.toUpperCase()}
                                </span>
                            </td>
                        </tr>
                    ))}
                    {assets.length === 0 && (
                        <tr>
                            <td colSpan={6} className="border border-black p-8 text-center text-gray-500 italic">No se encontraron activos para los criterios seleccionados.</td>
                        </tr>
                    )}
                </tbody>
            </table>
             
            <div className="mt-16 flex justify-around no-print-break">
                <div className="border-t border-black px-12 pt-1 text-center">
                    <p className="font-bold uppercase text-[8pt]">Encargado de Inventario</p>
                    <p className="text-[7pt] text-gray-500">Firma y Sello</p>
                </div>
                <div className="border-t border-black px-12 pt-1 text-center">
                    <p className="font-bold uppercase text-[8pt]">V° B° Dirección / Admin</p>
                    <p className="text-[7pt] text-gray-500">Firma y Sello</p>
                </div>
            </div>
        </div>
    );
}
