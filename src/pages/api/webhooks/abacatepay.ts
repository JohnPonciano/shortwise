
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Handle webhook logic here
  console.log('Abacatepay webhook received:', req.body);
  
  res.status(200).json({ message: 'Webhook received' });
}
