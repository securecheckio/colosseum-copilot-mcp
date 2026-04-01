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
async function callAPI(endpoint: string, options: RequestInit = {}) {
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
    },
  }
);

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
        } = args as any;

        const filters: any = {};
        if (winnersOnly !== undefined) filters.winnersOnly = winnersOnly;
        if (acceleratorOnly !== undefined) filters.acceleratorOnly = acceleratorOnly;
        if (techStack) filters.techStack = techStack;
        if (problemTags) filters.problemTags = problemTags;
        if (solutionTags) filters.solutionTags = solutionTags;

        const body: any = {
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
        } = args as any;

        const body: any = {
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
        const { slug } = args as any;
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
        const { documentId, offset = 0, maxChars = 8000 } = args as any;
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
        const { cohort, dimensions, topK = 10, samplePerBucket = 2 } = args as any;

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
        const { cohortA, cohortB, dimensions, topK = 10 } = args as any;

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
        const { key } = args as any;
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
        const { url, name, reason } = args as any;

        const body: any = { url };
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
        const { category, message, severity = 'medium', context } = args as any;

        const body: any = { category, message, severity };
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
