import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 加载环境变量
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3088;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API 配置
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// API 代理端点
app.post('/api/interpret', async (req, res) => {
    console.log('[DEBUG] Received /api/interpret request');
    console.log('[DEBUG] OPENAI_BASE_URL:', OPENAI_BASE_URL ? 'configured' : 'MISSING');
    console.log('[DEBUG] OPENAI_API_KEY:', OPENAI_API_KEY ? 'configured' : 'MISSING');

    // 检查环境变量配置
    if (!OPENAI_BASE_URL || !OPENAI_API_KEY) {
        console.log('[DEBUG] Missing configuration, returning 500');
        return res.status(500).json({ error: 'AI service not configured' });
    }

    try {
        const { messages, temperature = 0.7 } = req.body;

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
});

// 生产环境：提供静态文件
app.use(express.static(join(__dirname, 'dist')));

// SPA 回退路由
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📡 API proxy: /api/interpret -> ${OPENAI_BASE_URL}`);
});
