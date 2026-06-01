import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Agent, run } from '@openai/agents';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

// Securely assign the OpenAI API Key from OPENAI_API
process.env.OPENAI_API_KEY = process.env.OPENAI_API;

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-nano';
const distDir = path.resolve(__dirname, 'dist');

app.post('/api/agent/run', async (req, res) => {
  const { message, agentName, instructions } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ 
      error: "OpenAI API Key is missing. Please ensure OPENAI_API is configured in .env.local" 
    });
  }

  try {
    // Initialize the OpenAI Agent securely on the server-side
    const agent = new Agent({
      name: agentName || 'Marketing Intelligence Assistant',
      instructions: instructions || 'You are an autonomous AI Agent specialized in Marketing and Market Intelligence.',
      model: MODEL,
    });

    // Execute the agent securely
    const result = await run(agent, message || 'Hello! Tell me how you can assist me.');

    res.json({
      success: true,
      modelUsed: MODEL,
      finalOutput: result.finalOutput,
    });
  } catch (error) {
    console.error("Agent Execution Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Error occurred during agent execution.' 
    });
  }
});

app.use(express.static(distDir));

app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.startsWith('/api/')) {
    return next();
  }

  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Secure Server] Backend server running at http://localhost:${PORT}`);
});
