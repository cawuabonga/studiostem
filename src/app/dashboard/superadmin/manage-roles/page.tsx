
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getInstitutes } from "@/config/firebase";
import type { Institute } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RolesManager } from "@/components/superadmin/RolesManager";

export default function ManageRolesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [selectedInstituteId, setSelectedInstituteId] = useState<string>('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SuperAdmin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    getInstitutes().then(setInstitutes).catch(console.error);
  }, []);
  
  if (loading || !user || user.role !== 'SuperAdmin') {
    return <p>Cargando o no autorizado...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestionar Roles y Permisos por Instituto</CardTitle>
          <CardDescription>
            Selecciona un instituto para ver, crear, editar y eliminar los roles y asignarles permisos específicos.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="max-w-sm space-y-2">
                <Label htmlFor="institute-select">Instituto</Label>
                 <Select value={selectedInstituteId} onValueChange={setSelectedInstituteId}>
                    <SelectTrigger id="institute-select">
                        <SelectValue placeholder="Selecciona un instituto..." />
                    </SelectTrigger>
                    <SelectContent>
                        {institutes.map(institute => (
                            <SelectItem key={institute.id} value={institute.id}>
                                {institute.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>
      
      {selectedInstituteId && (
        <RolesManager key={selectedInstituteId} instituteId={selectedInstituteId} />
      )}
    </div>
  );
}
