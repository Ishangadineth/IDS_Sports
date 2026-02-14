import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const publicDir = path.join(process.cwd(), 'public');
        const iconPath = path.join(publicDir, 'favicon.ico');

        if (fs.existsSync(iconPath)) {
            const stats = fs.statSync(iconPath);
            return NextResponse.json({
                status: 'Found',
                size: stats.size,
                path: iconPath,
                filesInPublic: fs.readdirSync(publicDir)
            });
        } else {
            return NextResponse.json({
                status: 'Not Found',
                path: iconPath,
                filesInPublic: fs.readdirSync(publicDir)
            }, { status: 404 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
