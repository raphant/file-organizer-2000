import { checkMeetingSeconds, incrementMeetingSeconds } from '@/drizzle/schema';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const apiSecret = process.env.API_SECRET;

  if (request.headers.get('x-api-secret') !== apiSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
  }

  const usage = await checkMeetingSeconds(userId);
  return NextResponse.json(usage);
}

export async function POST(request: NextRequest) {
  const apiSecret = process.env.API_SECRET;

  if (request.headers.get('x-api-secret') !== apiSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
  }

  const body = await request.json();
  const { seconds } = body;

  if (typeof seconds !== 'number' || seconds <= 0) {
    return NextResponse.json({ error: 'Invalid seconds' }, { status: 400 });
  }

  const result = await incrementMeetingSeconds(userId, seconds);
  return NextResponse.json(result);
}