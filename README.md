# Colosseum Copilot MCP Server

MCP server that brings Colosseum Copilot to Cursor - search 5,400+ Solana hackathon projects and 84,000+ crypto archive documents to validate startup ideas and research the ecosystem.

## Quick Start

**1. Get API Token**

Get free PAT at [arena.colosseum.org/copilot](https://arena.colosseum.org/copilot)

**2. Choose Installation Method**

### Option A: Run from GitHub (Easiest)

Add to Cursor MCP settings:

```json
{
  "mcpServers": {
    "colosseum-copilot": {
      "command": "npx",
      "args": [
        "-y",
        "github:securecheckio/colosseum-copilot-mcp"
      ],
      "env": {
        "COLOSSEUM_COPILOT_PAT": "your-token-here"
      }
    }
  }
}
```

### Option B: Run from Local Clone

```bash
git clone https://github.com/securecheckio/colosseum-copilot-mcp.git
cd colosseum-copilot-mcp
npm install
npm run build
```

Add to Cursor MCP settings:

```json
{
  "mcpServers": {
    "colosseum-copilot": {
      "command": "node",
      "args": ["/absolute/path/to/colosseum-copilot-mcp/build/index.js"],
      "env": {
        "COLOSSEUM_COPILOT_PAT": "your-token-here"
      }
    }
  }
}
```

**3. Restart Cursor**

## Usage

Ask your Cursor AI:

```
Find Solana projects working on gasless transactions

Has anyone built a privacy-preserving stablecoin wallet?

Search for research papers about prediction markets

What were the most popular problem domains in Breakout hackathon?

Compare tech stacks used by winners vs non-winners
```

## Tools Available

| Tool | Description |
|------|-------------|
| `colosseum_status` | Check API connection |
| `colosseum_search_projects` | Search 5,400+ hackathon projects |
| `colosseum_search_archives` | Search 84,000+ archive documents |
| `colosseum_get_project` | Get full project details |
| `colosseum_get_archive_document` | Read archive document content |
| `colosseum_get_filters` | Get available filters/hackathons |
| `colosseum_analyze_cohort` | Analyze project cohorts |
| `colosseum_compare_cohorts` | Compare two cohorts |
| `colosseum_get_cluster` | Get project cluster info |
| `colosseum_suggest_source` | Suggest archive source |
| `colosseum_feedback` | Submit feedback |

## What It Does

**Honest Competition Check** - Tells you immediately if someone already built your idea

**Gap Classification** - Full gap, partial gap, or false gap

**Evidence-Based** - Every answer backed by real data, no speculation

**Deep Archive Access** - Cypherpunk literature, Satoshi's emails, Nick Szabo essays, protocol docs, investor research, Solana Breakpoint transcripts

## Troubleshooting

**401 Error**: PAT expired/invalid - get new one at [arena.colosseum.org/copilot](https://arena.colosseum.org/copilot)

**Tools not showing**: Restart Cursor, check MCP config path, verify PAT is set

**Build fails**: Requires Node.js 18+

## Resources

- [API Docs](https://docs.colosseum.com/copilot)
- [Get Token](https://arena.colosseum.org/copilot)
- [MCP Protocol](https://modelcontextprotocol.io/)

## License

MIT
