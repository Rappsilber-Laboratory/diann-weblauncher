import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '/';

  try {
    const parentDir = path.dirname(query);
    const basenameFragment = path.basename(query);

    // If query ends with / it means we want to explore that dir
    const scanDir = query.endsWith('/') ? query : (parentDir || '/');
    const fragment = query.endsWith('/') ? '' : basenameFragment;

    if (!fs.existsSync(scanDir)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(scanDir, { withFileTypes: true });
    
    const results = files
      .filter(f => f.name.startsWith(fragment))
      .map(f => {
        const fullPath = path.join(scanDir, f.name);
        return {
          name: f.name + (f.isDirectory() ? '/' : ''),
          path: fullPath + (f.isDirectory() ? '/' : ''),
          isDirectory: f.isDirectory()
        };
      })
      .slice(0, 50); // Limit results

    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json([]);
  }
}
