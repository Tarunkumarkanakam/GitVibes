import type { NextApiRequest, NextApiResponse } from 'next';

// Placeholder to load from process.env
const AI_API_SERVER = process.env.AI_API_SERVER || '';
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_MODEL_NAME = process.env.AI_MODEL_NAME || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { repo, type } = req.body; // type: 'short' | 'full'
  if (!repo) {
    return res.status(400).json({ error: 'Missing repo info' });
  }

  // Compose the prompt
  let prompt = '';
  if (type === 'full') {
    prompt = `Give a medium-length, witty, and brutally honest roast of this GitHub repo (be creative, but not offensive):\n${JSON.stringify(repo)}`;
  } else {
    prompt = `Give a short, witty roast of this GitHub repo:\n${JSON.stringify(repo)}`;
  }

  try {
    const response = await fetch(`${AI_API_SERVER}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL_NAME,
        messages: [
          { role: 'system', content: 'You are a sarcastic but insightful GitHub repo roaster.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: type === 'full' ? 180 : 60,
        temperature: 0.8
      })
    });
    if (!response.ok) {
      throw new Error('AI API error');
    }
    const data = await response.json();
    const roast = data.choices?.[0]?.message?.content || 'No roast available.';
    return res.status(200).json({ roast });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch roast comment.' });
  }
}
