// This API route has been deprecated and is no longer in use.
// File uploads are now handled directly by the client-side Firebase SDK.
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    return NextResponse.json({ error: 'This API is deprecated.' }, { status: 410 });
}
