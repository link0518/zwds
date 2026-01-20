import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface RequestBody {
    messages: Message[];
    temperature?: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 只允许 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 检查环境变量配置
    if (!OPENAI_BASE_URL || !OPENAI_API_KEY) {
        return res.status(500).json({ error: 'AI service not configured' });
    }

    try {
        const { messages, temperature = 0.7 } = req.body as RequestBody;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid request: messages required' });
        }

        const endpoint = `${OPENAI_BASE_URL.replace(/\/$/, '')}/chat/completions`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: OPENAI_MODEL,
                messages,
                temperature,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI API error:', errorText);
            return res.status(response.status).json({ error: 'AI service error' });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('Interpret API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
