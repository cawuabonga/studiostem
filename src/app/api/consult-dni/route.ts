import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

const DniSchema = z.object({
  dni: z.string().length(8, { message: 'El DNI debe tener 8 dígitos.' }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = DniSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error.flatten().fieldErrors.dni?.[0] }, { status: 400 });
    }

    const { dni } = validation.data;
    const token = process.env.API_PERU_TOKEN;

    if (!token) {
      console.error('API_PERU_TOKEN no está configurado en las variables de entorno.');
      return NextResponse.json({ success: false, error: 'El servicio de consulta no está configurado en el servidor.' }, { status: 500 });
    }

    const response = await fetch('https://apiperu.dev/api/dni', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ dni }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        // Personaliza el mensaje si la API de apiperu.dev dice 'No se encontraron resultados'
        if (errorData.message && errorData.message.includes('No se encontraron resultados')) {
            return NextResponse.json({ success: false, error: 'No se encontraron datos para el DNI consultado.' }, { status: 404 });
        }
        return NextResponse.json({ success: false, error: errorData.message || 'La consulta a la API externa falló.' }, { status: response.status });
    }

    const data = await response.json();

    if (data.success) {
        return NextResponse.json({ 
            success: true,
            data: {
                firstName: data.data.nombres,
                lastName: `${data.data.apellido_paterno} ${data.data.apellido_materno}`.trim(),
            }
        });
    } else {
         return NextResponse.json({ success: false, error: data.message || "No se encontraron datos para el DNI." }, { status: 404 });
    }

  } catch (error) {
    console.error('Error en la ruta /api/consult-dni:', error);
    return NextResponse.json({ success: false, error: 'Error interno del servidor.' }, { status: 500 });
  }
}
