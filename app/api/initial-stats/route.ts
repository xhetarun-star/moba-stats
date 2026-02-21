import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';
import { Match } from '@/lib/types';

const MATCHES_KEY = 'moba_matches';

export async function GET() {
    try {
        // 1. Try to get matches from Vercel KV (shared database)
        let matches = await kv.get<Match[]>(MATCHES_KEY);

        // 2. If it's the very first time (database empty), load from the JSON file
        if (!matches || matches.length === 0) {
            const filePath = path.join(process.cwd(), 'imported_stats.json');
            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf8');
                matches = JSON.parse(fileData);
                // Save to KV so it's there for next time
                await kv.set(MATCHES_KEY, matches);
            } else {
                matches = [];
            }
        }

        return NextResponse.json(matches);
    } catch (error) {
        // Fallback for local development if KV is not yet configured
        console.error('KV Error or missing config:', error);
        try {
            const filePath = path.join(process.cwd(), 'imported_stats.json');
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                return NextResponse.json(JSON.parse(data));
            }
        } catch (e) { }
        return NextResponse.json([]);
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { matches } = body;

        // Save the whole array to KV
        await kv.set(MATCHES_KEY, matches);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save matches' }, { status: 500 });
    }
}
