# CatLink MCP Server

MCP (Model Context Protocol) server that exposes Nokia Network as Code APIs as tools.

## What is MCP?

MCP is an open standard that enables AI applications to connect to external systems. This server exposes Nokia APIs as MCP tools that can be used by any MCP-compatible AI (Claude, Gemini, etc.).

## Available Tools

| Tool | Description | Nokia API |
|------|-------------|-----------|
| `verify_location` | Check if device is at a location | Location Verification |
| `verify_number` | Verify user identity by phone | Number Verification |
| `check_sim_swap` | Detect recent SIM swaps (fraud) | SIM Swap |
| `activate_qod` | Boost network priority | Quality on Demand |
| `check_device_status` | Check device connectivity | Device Status |
| `get_population_density` | Get area density | Population Density |

## Setup

```bash
cd mcp-server
pip install -r requirements.txt
```

## Environment Variables

```bash
export NOKIA_API_TOKEN="your-token"
export NOKIA_MOCK_MODE="false"  # Set to "true" for testing
```

## Run

```bash
python server.py
```

## Use with Claude Desktop

Add to your Claude Desktop config (`~/.claude/config.json`):

```json
{
  "mcpServers": {
    "catlink-nokia": {
      "command": "python",
      "args": ["/path/to/catlink/mcp-server/server.py"],
      "env": {
        "NOKIA_API_TOKEN": "your-token",
        "NOKIA_MOCK_MODE": "false"
      }
    }
  }
}
```

## Architecture

```
┌─────────────────────────────────────────────┐
│           AI Application                    │
│         (Claude, Gemini, etc.)              │
└─────────────────┬───────────────────────────┘
                  │ MCP Protocol
                  ▼
┌─────────────────────────────────────────────┐
│         CatLink MCP Server                  │
│           (this server)                     │
└─────────────────┬───────────────────────────┘
                  │ Nokia SDK
                  ▼
┌─────────────────────────────────────────────┐
│      Nokia Network as Code APIs             │
│  (via Orange, Vodafone, Movistar 5G)        │
└─────────────────────────────────────────────┘
```

## License

MIT - Open Gateway Hackathon 2026
