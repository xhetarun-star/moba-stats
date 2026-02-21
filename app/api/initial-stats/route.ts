import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';
import { Match } from '@/lib/types';

const MATCHES_KEY = 'moba_matches_v1'; // On change de clé pour être sûr de repartir sur du propre

// On force Next.js à ne pas mettre en cache cette page
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        console.log('Fetching matches from KV...');
        let matches = await kv.get<Match[]>(MATCHES_KEY);

        if (!matches || matches.length === 0) {
            console.log('KV is empty, looking for initial JSON...');
            const filePath = path.join(process.cwd(), 'imported_stats.json');
            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf8');
                matches = JSON.parse(fileData);
                console.log(`Importing ${matches?.length} matches to KV`);
                await kv.set(MATCHES_KEY, matches);
            } else {
                matches = [];
            }
        }

        return NextResponse.json(matches, {
            headers: {
                'Cache-Control': 'no-store, max-age=0, must-revalidate',
            }
        });
    } catch (error: any) {
        console.error('KV Error:', error.message);
        // Fallback local
        const filePath = path.join(process.cwd(), 'imported_stats.json');
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf8');
            return NextResponse.json(JSON.parse(data));
        }
        return NextResponse.json([]);
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { matches } = body;

        console.log(`Saving ${matches.length} matches to KV...`);
        await kv.set(MATCHES_KEY, matches);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Save Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
