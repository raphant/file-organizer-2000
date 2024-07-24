import { NextApiRequest, NextApiResponse } from 'next';
import { checkMeetingSeconds, incrementMeetingSeconds } from '../../app/drizzle/schema';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const apiSecret = process.env.API_SECRET;

  if (req.headers['x-api-secret'] !== apiSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid userId' });
  }

  if (req.method === 'GET') {
    const usage = await checkMeetingSeconds(userId);
    return res.status(200).json(usage);
  } else if (req.method === 'POST') {
    const { seconds } = req.body;

    if (typeof seconds !== 'number' || seconds <= 0) {
      return res.status(400).json({ error: 'Invalid seconds' });
    }

    const result = await incrementMeetingSeconds(userId, seconds);
    return res.status(200).json(result);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}