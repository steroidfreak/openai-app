# Top Movers ChatGPT App

A minimal TypeScript ChatGPT App that exposes a `topMovers` tool over the Model Context Protocol (MCP) using [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk) and an Express server. The tool connects to Alpha Vantage's [`TOP_GAINERS_LOSERS`](https://www.alphavantage.co/documentation/#topleaders) endpoint and renders the data inside an OpenAI Apps widget.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (the project uses `pnpm` scripts)
- An Alpha Vantage API key (create a free account at [alphavantage.co](https://www.alphavantage.co/support/#api-key))
- [ngrok](https://ngrok.com/) if you want to tunnel the local server to a public URL for testing with the ChatGPT Apps platform

## Getting started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy the environment template and add your Alpha Vantage API key:

   ```bash
   cp .env.example .env
   # edit .env to set ALPHA_VANTAGE_API_KEY
   ```

3. Build the client bundle and start the server in development mode:

   ```bash
   pnpm build:client
   pnpm dev
   ```

   The Express server listens on `http://localhost:3000` by default, serves the MCP endpoint at `/mcp`, and hosts the widget UI at the root path.

4. (Optional) Use ngrok to expose the local server so the ChatGPT app can reach it:

   ```bash
   ngrok http 3000
   ```

   Update your ChatGPT App manifest to reference the forwarded ngrok URL.

## Production build

To generate production-ready assets, build both the client and the server:

```bash
pnpm build:all
```

Then launch the compiled server:

```bash
pnpm start
```

## Project structure

```
public/                 # Static HTML shell for the widget UI
src/client/             # Browser TypeScript that talks to window.openai
src/server/             # Express + MCP server implementation
src/types/              # Local ambient type declarations
```

## Environment variables

| Variable | Description |
| --- | --- |
| `ALPHA_VANTAGE_API_KEY` | Required. API key used to query Alpha Vantage. |
| `PORT` | Optional. Port for the Express server (defaults to `3000`). |

## Running tests

This project does not include automated tests. Use the development server to manually verify the widget and tool responses.
