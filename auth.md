# Peaceful Loans auth.md

## Identity & Agent Access

Peaceful Loans welcomes autonomous AI agents, web agents, search assistants, and programmatic clients to discover, query, and evaluate our mortgage advisory resources, guides, and tools.

## Discovery & Permissions

- **Protocol Discovery:** Agents can discover site capabilities via:
  - ARD Manifest: `/.well-known/ai-catalog.json`
  - MCP Server Card: `/.well-known/mcp/server-card.json`
  - Agent Skills Index: `/.well-known/agent-skills/index.json`
  - API Catalog: `/.well-known/api-catalog`
  - LLM Text Summary: `/llms.txt`
- **Anonymous Read-Only Access:** Public advisory articles, interest rate trackers, FAQ guides, and calculation tools require no authentication or API keys.
- **Client Consultations & Leads:** Inquiries for 1-on-1 advisor consultations should be directed to the web contact form at `https://peaceful-loans.com` or emailed to `mangesh@peaceful-loans.com`.

## Scopes & Policy

| Scope | Description | Authentication |
| :--- | :--- | :--- |
| `read:public` | Read public advisory guides, FAQs, and rate comparisons | Anonymous |
| `tool:calculate` | Execute client-side WebMCP calculation tools | Anonymous |
| `contact:advisory` | Submit consultation request for home loan advisory | Form / Direct Contact |

## Security & Rate Limiting

- Crawlers and agents should identify themselves with accurate `User-Agent` headers.
- Respect crawl rate guidelines indicated in `robots.txt` and `Content-Signal: ai-train=yes, search=yes, ai-input=yes`.
