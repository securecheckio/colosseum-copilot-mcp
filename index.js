#!/usr/bin/env node
/**
 * Colosseum Copilot MCP Server
 * 
 * Provides Solana startup research tools with access to 5,400+ hackathon projects,
 * 84,000+ archive documents, and ecosystem data
 * 
 * Usage:
 *   1. Get PAT from https://arena.colosseum.org/copilot
 *   2. Set COLOSSEUM_COPILOT_PAT environment variable
 *   3. Add to Cursor MCP config
 *   4. Tools become available to Cursor agent
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Configuration
const API_BASE = process.env.COLOSSEUM_COPILOT_API_BASE || 'https://copilot.colosseum.com/api/v1';
const PAT = process.env.COLOSSEUM_COPILOT_PAT;

if (!PAT) {
  console.error('Error: COLOSSEUM_COPILOT_PAT environment variable is required');
  console.error('Get your token at: https://arena.colosseum.org/copilot');
  process.exit(1);
}

// API Helper
async function callAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${PAT}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`API Error (${response.status}): ${error.error || error.message || response.statusText}`);
  }

  return response.json();
}

// MCP Server setup
const server = new Server(
  {
    name: 'colosseum-copilot',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Resource: Deep Dive Guide
const DEEP_DIVE_GUIDE = `# Colosseum Copilot Deep Dive Workflows

## When to Use Deep Dive

Trigger a full research workflow when the user says:
- "vet this idea"
- "deep dive" or "full analysis"
- "should I build X?" or "is X worth building?"
- "validate this idea"

## The 8-Step Deep Dive Process

### 1. Parallel Data Gathering
Run these searches simultaneously:
- \`colosseum_search_projects\` with relevant query
- \`colosseum_search_archives\` with conceptual keywords
- \`colosseum_get_filters\` to understand available hackathons/tracks

### 2. Project Search (Semantic)
Use \`colosseum_search_projects\` with:
- Natural language query describing the idea
- Filters: \`winnersOnly: true\` to see prize winners
- \`limit: 10-15\` for comprehensive coverage
- Note the \`similarity\` scores and \`evidence\` snippets

### 3. Archive Search (Conceptual Precedents)
Use \`colosseum_search_archives\` with:
- 3-6 focused keywords (not full sentences)
- \`limit: 5-8\` documents
- \`intent: "ideation"\` for broader recall
- Look for foundational concepts, not just implementations

### 4. Landscape Check
- Check \`crowdedness\` scores from project results
- Use \`cluster\` data to understand related projects
- For top matches, call \`colosseum_get_project\` to get full details

### 5. Hackathon Analysis
Use \`colosseum_analyze_cohort\` to understand trends:
- Analyze recent hackathons by \`problemTags\`
- Check \`techStack\` distribution
- Identify \`solutionTags\` patterns

### 6. Incumbent Validation & Gap Classification

**Full Gap**: No matching projects found
- Evidence: Empty search results or very low similarity (<0.3)
- Response: "Nobody has built this in Colosseum hackathons"

**Partial Gap**: Projects exist but incomplete
- Evidence: Similar projects but different segment/UX/geography
- Classify by:
  - **Segment**: Different target users (B2B vs B2C, retail vs institutional)
  - **UX**: Different interface (mobile vs web, CLI vs GUI)
  - **Geographic**: Different regions or regulatory contexts
  - **Pricing**: Different business models
  - **Integration**: Different protocols or chains
- Response: "X built this, but focused on Y. Gap exists in Z"

**False Gap**: Already well-covered
- Evidence: Multiple high-similarity projects (>0.6), prize winners
- Response: "This is crowded. Projects A, B, C already built this"

### 7. Opportunity Ranking
Based on evidence, rank opportunities by:
1. **Gap size**: How much is missing?
2. **Validation**: Did similar ideas win prizes?
3. **Crowdedness**: How many competitors?
4. **Archive support**: Is there research backing this?
5. **Trend alignment**: Is this a growing category?

### 8. Structured Report Format

\`\`\`
## Similar Projects
[List 5-8 projects with slugs, similarity scores, and what they built]

## Archive Insights
[3-5 key concepts from research papers/historical docs with citations]

## Current Landscape
[Crowdedness assessment, cluster analysis, winning patterns]

## Gap Classification
[Full / Partial / False with specific evidence]

## Top Opportunity
### Problem Statement
[What specific problem to solve]

### Wedge / Differentiation
[Specific angle: segment, UX, integration, etc.]

### Revenue Model
[Based on similar projects and market]

### GTM Strategy
[Based on winning project patterns]

### Why Crypto / Why Solana
[Technical fit from archive research]

### Risks
[Based on crowdedness and validation]
\`\`\`

## Evidence Floors by Query Type

| Query Type | Required Evidence |
|------------|------------------|
| Pure retrieval | Project slugs from search results |
| Archive retrieval | Document titles and URLs |
| Comparison | Project evidence for each side + archive citation |
| Evaluative | Project + archive + landscape evidence |
| Build guidance | Project + archive + incumbent + landscape evidence |

## Common Patterns

### Pattern: Validate Startup Idea
\`\`\`
User: "I want to build a privacy-preserving stablecoin wallet on Solana"

Workflow:
1. Search projects: "privacy stablecoin wallet"
2. Search archives: "privacy electronic cash zero knowledge"
3. Get filters to see recent hackathons
4. Analyze cohort: privacy category trends
5. Get full details on top 2-3 matches
6. Classify gap: segment/UX/integration difference
7. Report with specific opportunity
\`\`\`

### Pattern: Research Competitive Landscape
\`\`\`
User: "Who's building DeFi lending on Solana?"

Workflow:
1. Search projects: "defi lending" with winners filter
2. Analyze cohort: lending category by tech stack
3. Get cluster data for lending projects
4. Search archives: "defi lending protocols"
5. Compare cohorts: winners vs non-winners
6. Report crowdedness and winning patterns
\`\`\`

### Pattern: Hackathon Trend Analysis
\`\`\`
User: "What are the trending problem domains in Breakout?"

Workflow:
1. Get filters to confirm hackathon slug
2. Analyze cohort: Breakout by problemTags
3. Compare with previous hackathon (e.g., Radar)
4. Identify shift in focus areas
5. Sample top projects per category
6. Report with trend insights
\`\`\`

## Tips for Best Results

1. **Always start with filters** - Call \`colosseum_get_filters\` first to get valid hackathon slugs and understand chronology

2. **Use evidence snippets** - The \`evidence\` field in search results tells you WHY it matched

3. **Check similarity scores**:
   - >0.6 = very relevant
   - 0.4-0.6 = relevant
   - <0.4 = tangentially related

4. **Archive search keywords** - Use 3-6 focused conceptual terms, not full sentences:
   - Good: "prediction markets futarchy governance"
   - Bad: "how do prediction markets work for governance"

5. **Iterate searches** - If initial results are off, refine query based on what you learned

6. **Get full project details** - For top 2-3 matches, always call \`colosseum_get_project\` to see complete description

7. **Use cohort analysis** - Understand ecosystem patterns before making recommendations

8. **Cite everything** - Always reference project slugs, archive titles, and hackathon names

9. **Be honest about gaps** - Don't sugar-coat crowded spaces or false gaps

10. **Parallel where possible** - Run independent searches simultaneously for speed
`;

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'colosseum://deep-dive-guide',
      name: 'Deep Dive Workflows Guide',
      description: 'Complete guide for orchestrating Colosseum Copilot tools into deep research workflows. Read this to understand how to validate startup ideas, analyze competitive landscapes, and conduct thorough market research.',
      mimeType: 'text/markdown',
    },
  ],
}));

// Read resource content
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  if (uri === 'colosseum://deep-dive-guide') {
    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: DEEP_DIVE_GUIDE,
        },
      ],
    };
  }
  
  throw new Error(`Unknown resource: ${uri}`);
});

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'colosseum_status',
      description: 'Check API authentication status and token validity',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'colosseum_search_projects',
      description: 'Search 5,400+ Solana hackathon projects by concept, tech stack, or problem domain. Returns projects with similarity scores, evidence snippets, and metadata.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Natural language search query (max 500 chars). Omit for filter-only browsing.',
          },
          limit: {
            type: 'number',
            description: 'Max results to return (1-25, default 10)',
            default: 10,
          },
          offset: {
            type: 'number',
            description: 'Pagination offset (default 0)',
            default: 0,
          },
          hackathons: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by hackathon slugs (max 10)',
          },
          trackKeys: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by track keys in format hackathon/track (max 10)',
          },
          winnersOnly: {
            type: 'boolean',
            description: 'Only return prize-winning projects',
          },
          acceleratorOnly: {
            type: 'boolean',
            description: 'Only return accelerator portfolio companies',
          },
          diversify: {
            type: 'boolean',
            description: 'Enable cross-hackathon diversity ranking (default true)',
            default: true,
          },
          techStack: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by tech stack tags (max 10)',
          },
          problemTags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by problem domain tags (max 10)',
          },
          solutionTags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by solution approach tags (max 10)',
          },
        },
      },
    },
    {
      name: 'colosseum_search_archives',
      description: 'Search 84,000+ archive documents (cypherpunk literature, protocol docs, Satoshi emails, research papers) for conceptual precedents. Auto-cascades through search tiers for best results.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (3-6 focused keywords recommended, max 500 chars)',
          },
          limit: {
            type: 'number',
            description: 'Max documents to return (1-10, default 5)',
            default: 5,
          },
          offset: {
            type: 'number',
            description: 'Pagination offset (default 0)',
            default: 0,
          },
          sources: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by source keys (max 20). Use colosseum_get_filters to see available sources.',
          },
          maxChunksPerDoc: {
            type: 'number',
            description: 'Chunks per document (1-4, default 2)',
            default: 2,
          },
          intent: {
            type: 'string',
            enum: ['docs', 'ideation'],
            description: 'Search intent: "docs" for precision, "ideation" for broader recall (default "docs")',
            default: 'docs',
          },
          minSimilarity: {
            type: 'number',
            description: 'Minimum cosine similarity (0-1, default 0.2). Lower for niche queries.',
            default: 0.2,
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'colosseum_get_project',
      description: 'Fetch full details for a specific project by slug. Use when search evidence snippets are insufficient.',
      inputSchema: {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            description: 'Project slug (from search results)',
          },
        },
        required: ['slug'],
      },
    },
    {
      name: 'colosseum_get_archive_document',
      description: 'Fetch paged content from an archive document. Use offset and maxChars to page through long documents.',
      inputSchema: {
        type: 'object',
        properties: {
          documentId: {
            type: 'string',
            description: 'Archive document UUID (from search results)',
          },
          offset: {
            type: 'number',
            description: 'Character offset to start from (default 0)',
            default: 0,
          },
          maxChars: {
            type: 'number',
            description: 'Maximum characters to return (200-20000, default 8000)',
            default: 8000,
          },
        },
        required: ['documentId'],
      },
    },
    {
      name: 'colosseum_get_filters',
      description: 'Get available filters, hackathon chronology, and canonical slugs. Use to discover valid filter values before searching.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'colosseum_analyze_cohort',
      description: 'Summarize tag/track distributions for a cohort of projects. Useful for understanding hackathon trends and ecosystem patterns.',
      inputSchema: {
        type: 'object',
        properties: {
          cohort: {
            type: 'object',
            description: 'Cohort definition with filters (hackathons, trackKeys, winnersOnly, acceleratorOnly, etc.)',
          },
          dimensions: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['tracks', 'problemTags', 'solutionTags', 'primitives', 'techStack', 'targetUsers', 'clusters'],
            },
            description: 'Dimensions to analyze',
          },
          topK: {
            type: 'number',
            description: 'Max buckets per dimension (1-20, default 10)',
            default: 10,
          },
          samplePerBucket: {
            type: 'number',
            description: 'Sample project slugs per bucket (0-5, default 2)',
            default: 2,
          },
        },
        required: ['cohort', 'dimensions'],
      },
    },
    {
      name: 'colosseum_compare_cohorts',
      description: 'Compare two cohorts across dimensions. Useful for analyzing differences between hackathons, winners vs non-winners, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          cohortA: {
            type: 'object',
            description: 'First cohort definition',
          },
          cohortB: {
            type: 'object',
            description: 'Second cohort definition',
          },
          dimensions: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['tracks', 'problemTags', 'solutionTags', 'primitives', 'techStack', 'targetUsers', 'clusters'],
            },
            description: 'Dimensions to compare',
          },
          topK: {
            type: 'number',
            description: 'Max items per dimension (1-20, default 10)',
            default: 10,
          },
        },
        required: ['cohortA', 'cohortB', 'dimensions'],
      },
    },
    {
      name: 'colosseum_get_cluster',
      description: 'Fetch details for a project cluster including summary, representative projects, and top tags.',
      inputSchema: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'Cluster key in format "v{version}-c{cluster}" (e.g., "v1-c12")',
          },
        },
        required: ['key'],
      },
    },
    {
      name: 'colosseum_suggest_source',
      description: 'Suggest a new source for the archive corpus. Team reviews all submissions.',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL of the source to suggest',
          },
          name: {
            type: 'string',
            description: 'Name or title of the source (max 200 chars)',
          },
          reason: {
            type: 'string',
            description: 'Why this source would be valuable (max 500 chars)',
          },
        },
        required: ['url'],
      },
    },
    {
      name: 'colosseum_feedback',
      description: 'Report errors, quality issues, or suggestions. High/critical severity escalated immediately.',
      inputSchema: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['error', 'quality', 'suggestion', 'other'],
            description: 'Feedback category',
          },
          message: {
            type: 'string',
            description: 'Description of the issue (max 5000 chars)',
          },
          severity: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            description: 'Issue severity (default medium)',
            default: 'medium',
          },
          context: {
            type: 'object',
            description: 'Structured context (query, endpoint, error details, max 10KB)',
          },
        },
        required: ['category', 'message'],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'colosseum_status': {
        const result = await callAPI('/status');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'colosseum_search_projects': {
        const {
          query,
          limit = 10,
          offset = 0,
          hackathons,
          trackKeys,
          winnersOnly,
          acceleratorOnly,
          diversify = true,
          techStack,
          problemTags,
          solutionTags,
        } = args;

        const filters = {};
        if (winnersOnly !== undefined) filters.winnersOnly = winnersOnly;
        if (acceleratorOnly !== undefined) filters.acceleratorOnly = acceleratorOnly;
        if (techStack) filters.techStack = techStack;
        if (problemTags) filters.problemTags = problemTags;
        if (solutionTags) filters.solutionTags = solutionTags;

        const body = {
          limit,
          offset,
          diversify,
        };
        if (query) body.query = query;
        if (hackathons) body.hackathons = hackathons;
        if (trackKeys) body.trackKeys = trackKeys;
        if (Object.keys(filters).length > 0) body.filters = filters;

        const result = await callAPI('/search/projects', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'colosseum_search_archives': {
        const {
          query,
          limit = 5,
          offset = 0,
          sources,
          maxChunksPerDoc = 2,
          intent = 'docs',
          minSimilarity = 0.2,
        } = args;

        const body = {
          query,
          limit,
          offset,
          maxChunksPerDoc,
          intent,
          minSimilarity,
        };
        if (sources) body.sources = sources;

        const result = await callAPI('/search/archives', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'colosseum_get_project': {
        const { slug } = args;
        const result = await callAPI(`/projects/by-slug/${encodeURIComponent(slug)}`);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'colosseum_get_archive_document': {
        const { documentId, offset = 0, maxChars = 8000 } = args;
        const result = await callAPI(
          `/archives/${encodeURIComponent(documentId)}?offset=${offset}&maxChars=${maxChars}`
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'colosseum_get_filters': {
        const result = await callAPI('/filters');

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'colosseum_analyze_cohort': {
        const { cohort, dimensions, topK = 10, samplePerBucket = 2 } = args;

        const result = await callAPI('/analyze', {
          method: 'POST',
          body: JSON.stringify({
            cohort,
            dimensions,
            topK,
            samplePerBucket,
          }),
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'colosseum_compare_cohorts': {
        const { cohortA, cohortB, dimensions, topK = 10 } = args;

        const result = await callAPI('/compare', {
          method: 'POST',
          body: JSON.stringify({
            cohortA,
            cohortB,
            dimensions,
            topK,
          }),
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'colosseum_get_cluster': {
        const { key } = args;
        const result = await callAPI(`/clusters/${encodeURIComponent(key)}`);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'colosseum_suggest_source': {
        const { url, name, reason } = args;

        const body = { url };
        if (name) body.name = name;
        if (reason) body.reason = reason;

        const result = await callAPI('/source-suggestions', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'colosseum_feedback': {
        const { category, message, severity = 'medium', context } = args;

        const body = { category, message, severity };
        if (context) body.context = context;

        const result = await callAPI('/feedback', {
          method: 'POST',
          body: JSON.stringify(body),
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Colosseum Copilot MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
