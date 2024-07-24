import { NextRequest, NextResponse } from 'next/server';
import { db, UserUsageTable, checkApiUsage, incrementTokenUsage } from '@/app/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const apiSecret = request.headers.get('X-API-Secret');
  if (apiSecret !== process.env.API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = request.nextUrl.searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
  }

  const usage = await checkApiUsage(userId);
  return NextResponse.json(usage);
}

export async function POST(request: NextRequest) {
  const apiSecret = request.headers.get('X-API-Secret');
  if (apiSecret !== process.env.API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, tokens, minutes } = await request.json();
  if (!userId || (!tokens && !minutes)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const tokenResult = await incrementTokenUsage(userId, tokens || 0);
  
  // Update minutes used
  await db.update(UserUsageTable)
    .set({ minutesUsed: sql`${UserUsageTable.minutesUsed} + ${minutes || 0}` })
    .where(eq(UserUsageTable.userId, userId));

  return NextResponse.json({ ...tokenResult, minutesUpdated: true });
}