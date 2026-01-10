
"use client";

import React from 'react';
import type { Asset, Institute, Building, Environment } from '@/types';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PrintInventoryListProps {
    assets: Asset[];
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

export function PrintInventoryList({ assets, institute, filters, buildings, allEnvironments }: PrintInventoryListProps) {
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
        
        return descriptions.length > 0 ? descriptions.join(' | ') : 'Sin filtros aplicados';
    }

    return (
        <div className="printable-area p-8 font-sans text-black">
            <header className="print-header flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    {institute?.logoUrl && (
                        <Image src={institute.logoUrl} alt={`${institute.name} Logo`} width={60} height={60} className="object-contain" />
                    )}
                    <div>
                        <h1 className="text-lg font-bold">{institute?.name || 'Nombre del Instituto'}</h1>
                        <p className="text-sm">Sistema de Gestión de Inventario</p>
                    </div>
                </div>
                <div className="text-xs text-right">
                    <p>Fecha de Emisión: {format(today, 'dd/MM/yyyy')}</p>
                    <p>Hora de Emisión: {format(today, 'HH:mm')}</p>
                </div>
            </header>

            <div className="text-center my-6">
                <h2 className="text-xl font-bold uppercase">Reporte de Inventario</h2>
                <p className="text-sm text-gray-600">Filtros aplicados: {getFilterDescription()}</p>
            </div>
            
            <table className="w-full text-xs border-collapse border border-gray-400">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border p-2 text-left">N°</th>
                        <th className="border p-2 text-left">Activo</th>
                        <th className="border p-2 text-left">Código/Serial</th>
                        <th className="border p-2 text-left">Ubicación</th>
                        <th className="border p-2 text-left">Tipo</th>
                        <th className="border p-2 text-left">Estado</th>
                        <th className="border p-2 text-left">Fecha Adq.</th>
                    </tr>
                </thead>
                <tbody>
                    {assets.map((asset, index) => (
                        <tr key={asset.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border p-2 text-center">{index + 1}</td>
                            <td className="border p-2">{asset.name}</td>
                            <td className="border p-2">{asset.codeOrSerial}</td>
                            <td className="border p-2">{asset.buildingName} / {asset.environmentName}</td>
                            <td className="border p-2">{asset.type}</td>
                            <td className="border p-2">{asset.status}</td>
                            <td className="border p-2">{asset.acquisitionDate ? format(asset.acquisitionDate.toDate(), 'dd/MM/yyyy') : 'N/A'}</td>
                        </tr>
                    ))}
                    {assets.length === 0 && (
                        <tr>
                            <td colSpan={7} className="border p-4 text-center text-gray-500">No se encontraron activos con los filtros seleccionados.</td>
                        </tr>
                    )}
                </tbody>
            </table>
             <footer className="text-center mt-20">
                <p className="text-xs">Total de activos en el reporte: {assets.length}</p>
            </footer>
        </div>
    );
}

