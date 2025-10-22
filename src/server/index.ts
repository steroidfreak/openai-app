import path from 'node:path';
import { fileURLToPath } from 'node:url';

import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import {
  McpServer,
  McpError,
  McpToolInvocation,
  McpToolResult,
} from '@modelcontextprotocol/sdk';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const server = new McpServer({
  name: 'top-movers-server',
  version: '0.1.0',
});

type TopMoversInput = {
  limit?: number;
};

type AlphaVantageQuote = {
  ticker: string;
  price: string;
  change_amount: string;
  change_percentage: string;
  volume?: string;
};

const clampLimit = (value: number | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 5;
  }
  return Math.min(Math.max(Math.floor(value), 1), 20);
};

server.tool(
  'topMovers',
  {
    description:
      'Fetches the top market movers using Alpha Vantage\'s TOP_GAINERS_LOSERS endpoint.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of rows to return (between 1 and 20).',
          minimum: 1,
          maximum: 20,
          default: 5,
        },
      },
    },
  },
  async (_context: McpToolInvocation, input: TopMoversInput): Promise<McpToolResult> => {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) {
      throw new McpError('Missing Alpha Vantage API key. Set ALPHA_VANTAGE_API_KEY in your environment.');
    }

    const limit = clampLimit(input.limit);

    const url = 'https://www.alphavantage.co/query';
    const params = {
      function: 'TOP_GAINERS_LOSERS',
      apikey: apiKey,
    } as const;

    const response = await axios.get(url, { params });
    const payload = response.data as {
      top_gainers?: AlphaVantageQuote[];
      top_losers?: AlphaVantageQuote[];
      most_actively_traded?: AlphaVantageQuote[];
      message?: string;
      note?: string;
    };

    if (payload.message) {
      throw new McpError(payload.message);
    }

    if (payload.note) {
      throw new McpError(payload.note);
    }

    const topGainers = (payload.top_gainers ?? []).slice(0, limit);
    const topLosers = (payload.top_losers ?? []).slice(0, limit);
    const mostActive = (payload.most_actively_traded ?? []).slice(0, limit);

    return {
      content: [
        {
          type: 'json',
          data: {
            limit,
            topGainers,
            topLosers,
            mostActivelyTraded: mostActive,
          },
        },
      ],
    };
  }
);

app.use('/mcp', server.createExpressRouter());

app.use('/client', express.static(path.resolve(__dirname, '../../dist/client')));
app.use(express.static(path.resolve(__dirname, '../../public')));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.resolve(__dirname, '../../public/index.html'));
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  console.log(`MCP endpoint available at http://localhost:${port}/mcp`);
});
