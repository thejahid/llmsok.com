# llmsok — Is your site agent-ready?

**[llmsok.com](https://llmsok.com)** is a free **website scanner** built for the **AI agent** era: paste almost any public URL and get an **agent readiness score**, category breakdowns, and **pass/fail checks** with evidence (status codes, headers, and short excerpts)—not a black-box “AI SEO” score.

If you care whether **LLMs, crawlers, chatbots, and automation** can **discover**, **respect**, and **use** your site the way you intend, start here: **[llmsok.com](https://llmsok.com)**.

---

## What “agent readiness” means here

**Agent readiness** is the boring infrastructure layer: **robots.txt**, **sitemaps**, **llms.txt**, **MCP** and **OAuth** discovery files, **agent skills** indexes, **content signals**, and related signals. When that layer is messy or missing, agents waste tokens, mis-route, or skip your site entirely. llmsok surfaces that layer so you can **prioritize fixes** with receipts you can trace.

---

## What the scan checks (high level)

llmsok groups checks into **five categories** you see in the UI—roughly **nineteen automated checks** by default—so you can see where you are strong vs where you are leaking trust:

- **Discoverability** — e.g. **robots.txt**, **XML sitemap** reachability, **Link** headers that help clients find alternate representations.  
- **Content accessibility** — e.g. whether important resources support **Markdown negotiation** where it matters.  
- **Bot access control** — e.g. **robots.txt** rules aimed at AI crawlers, **Content-Signal** style hints, and **web bot authentication** surfaces.  
- **Discovery (APIs & agents)** — e.g. **API catalog** (`/.well-known/api-catalog`), **OAuth** discovery and protected-resource metadata, **MCP server card** (`/.well-known/mcp/server-card.json`), **agent skills** discovery, **WebMCP**, and optional **A2A agent card** style signals.  
- **Commerce / protocols** — signals such as **x402**, **MPP**, **UCP**, **ACP**, and **AP2** where your host exposes them—useful when you are in payments or agent-commerce experiments.

Results are **evidence-first**: expand a row, see what was requested, what came back, and **copy-friendly prompts** when you want help drafting a fix.

---

## Free generators on llmsok.com

Same domain as the scan—built so the files you ship line up with what the scanner looks for:

| Tool | Link | What it does |
|------|------|----------------|
| **AI policy bundle** | [llmsok.com/tools/ai-policy-bundle-generator](https://llmsok.com/tools/ai-policy-bundle-generator) | Prefill **ai.txt**, JSON **llms** policy, **robots.txt**, and **humans.txt** from one site URL. |
| **LLMs.txt** | [llmsok.com/tools/llms-txt-generator](https://llmsok.com/tools/llms-txt-generator) | **Markdown llms.txt** draft from your URL and **sitemap**-aware titles. |
| **agent.json** | [llmsok.com/tools/agent-json-generator](https://llmsok.com/tools/agent-json-generator) | **agent.json** draft with the **same prefill** flow as the LLMs.txt tool. |

---

## Blog: guides you can read without signing up

Practical articles on **[llmsok.com/blog](https://llmsok.com/blog)**—good companions after your first scan:

- [What “agent-ready” actually means for your website](https://llmsok.com/blog/what-agent-ready-means)  
- [How to read an agent readiness scan (without drowning in jargon)](https://llmsok.com/blog/how-to-read-a-readiness-scan)  
- [Why robots.txt and llms.txt matter for AI crawlers](https://llmsok.com/blog/robots-txt-and-llms-txt-for-ai)  
- [MCP server cards and agent cards: what site owners should know](https://llmsok.com/blog/mcp-and-agent-cards-for-site-owners)  
- [From checklist to shipping: fix the highest-impact gaps first](https://llmsok.com/blog/fixing-highest-impact-readiness-gaps)  
- [Building trust with agents: discovery, limits, and honesty](https://llmsok.com/blog/building-trust-with-ai-agents)  

---

## Who llmsok is for

- **Developers and site owners** who need a **repeatable** readiness check—not a one-off blog checklist.  
- **Teams shipping MCP, OAuth, or agent-facing APIs** who want **well-known** paths and cards to match reality.  
- **Anyone publishing llms.txt or agent.json** who wants generators aligned with a real scanner.

**No account is required** to run a scan or use the generators on **[llmsok.com](https://llmsok.com)**.

---

**Run a free scan → [https://llmsok.com](https://llmsok.com)**
