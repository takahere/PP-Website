#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
// Base URL for the Next.js API
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
// Data source definitions
const DATA_SOURCES = {
    // Traffic
    ga: { endpoint: '/api/analytics/ga', description: 'GA4 traffic data' },
    realtime: { endpoint: '/api/analytics/realtime', description: 'Realtime active users' },
    trends: { endpoint: '/api/analytics/trends', description: 'Traffic trends' },
    // Search
    gsc: { endpoint: '/api/analytics/gsc', description: 'Google Search Console data' },
    // Content
    'lab-metrics': { endpoint: '/api/analytics/lab-metrics', description: 'Partner Lab metrics' },
    'content-groups': { endpoint: '/api/analytics/content-groups', description: 'Content group analysis' },
    'page-performance': { endpoint: '/api/analytics/page-performance', description: 'Page performance' },
    // User behavior
    'user-funnel': { endpoint: '/api/analytics/user-funnel', description: 'User funnel analysis' },
    'user-segments': { endpoint: '/api/analytics/user-segments', description: 'User segments' },
    engagement: { endpoint: '/api/analytics/engagement', description: 'Engagement metrics' },
    cohorts: { endpoint: '/api/analytics/cohorts', description: 'Cohort analysis' },
    // Acquisition
    acquisition: { endpoint: '/api/analytics/acquisition', description: 'Acquisition analysis' },
    campaigns: { endpoint: '/api/analytics/campaigns', description: 'Campaign performance' },
    'lab-attribution': { endpoint: '/api/analytics/lab-attribution', description: 'Lab attribution' },
    // Technical
    'web-vitals': { endpoint: '/api/analytics/web-vitals', description: 'Core Web Vitals' },
    'tech-environment': { endpoint: '/api/analytics/tech-environment', description: 'Tech environment' },
    'technical-issues': { endpoint: '/api/analytics/technical-issues', description: 'Technical issues' },
    // Others
    'site-search': { endpoint: '/api/analytics/site-search', description: 'Site search analysis' },
    'landing-pages': { endpoint: '/api/analytics/landing-pages', description: 'Landing pages' },
    'exit-pages': { endpoint: '/api/analytics/exit-pages', description: 'Exit pages' },
    events: { endpoint: '/api/analytics/events', description: 'Custom events' },
    'form-analysis': { endpoint: '/api/analytics/form-analysis', description: 'Form analysis' },
};
// Tool definitions
const TOOLS = [
    {
        name: 'fetch_analytics_data',
        description: 'Fetch analytics data from specified sources. Use this to get traffic, search, user behavior, and other analytics data.',
        inputSchema: {
            type: 'object',
            properties: {
                sources: {
                    type: 'array',
                    items: {
                        type: 'string',
                        enum: Object.keys(DATA_SOURCES),
                    },
                    description: 'Data sources to fetch (max 5)',
                },
                dateRange: {
                    type: 'string',
                    enum: ['7d', '30d', '90d'],
                    description: 'Date range for the data',
                },
                refresh: {
                    type: 'boolean',
                    description: 'Force refresh cache',
                },
            },
            required: ['sources'],
        },
    },
    {
        name: 'generate_hypothesis',
        description: 'Generate a hypothesis about what data the user needs based on their request. Returns interpreted intent, relevant data sources, and confidence level.',
        inputSchema: {
            type: 'object',
            properties: {
                userRequest: {
                    type: 'string',
                    description: 'The user\'s original request',
                },
                previousAnswers: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            question: { type: 'string' },
                            answer: { type: 'string' },
                        },
                    },
                    description: 'Previous clarifying answers',
                },
            },
            required: ['userRequest'],
        },
    },
    {
        name: 'ask_clarifying_questions',
        description: 'Generate clarifying questions when the user intent is unclear. Returns 1-3 questions with multiple choice options.',
        inputSchema: {
            type: 'object',
            properties: {
                hypothesis: {
                    type: 'object',
                    properties: {
                        intent: { type: 'string' },
                        confidence: { type: 'number' },
                        dataSources: {
                            type: 'array',
                            items: { type: 'string' },
                        },
                    },
                    description: 'The current hypothesis about user intent',
                },
                answeredQuestions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Questions already answered',
                },
            },
            required: ['hypothesis'],
        },
    },
    {
        name: 'generate_sheet_data',
        description: 'Generate structured spreadsheet data with chart configuration from analytics data.',
        inputSchema: {
            type: 'object',
            properties: {
                command: {
                    type: 'string',
                    description: 'Natural language description of the data to generate',
                },
                dataSources: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Data sources to use',
                },
            },
            required: ['command'],
        },
    },
];
// Helper function to fetch data from API
async function fetchFromAPI(endpoint, params) {
    const url = new URL(endpoint, API_BASE_URL);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
    }
    try {
        const response = await fetch(url.toString(), {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    }
    catch (error) {
        console.error(`Failed to fetch from ${endpoint}:`, error);
        throw error;
    }
}
// Tool handlers
async function handleFetchAnalyticsData(args) {
    const { sources, dateRange = '30d', refresh = false } = args;
    // Limit to 5 sources
    const limitedSources = sources.slice(0, 5);
    const results = {};
    await Promise.all(limitedSources.map(async (source) => {
        const sourceConfig = DATA_SOURCES[source];
        if (sourceConfig) {
            try {
                const params = {};
                if (refresh)
                    params.refresh = 'true';
                if (dateRange)
                    params.dateRange = dateRange;
                results[source] = await fetchFromAPI(sourceConfig.endpoint, params);
            }
            catch (error) {
                results[source] = { error: `Failed to fetch ${source}`, message: String(error) };
            }
        }
    }));
    return JSON.stringify(results, null, 2);
}
async function handleGenerateHypothesis(args) {
    const { userRequest, previousAnswers = [] } = args;
    // Analyze the request and generate hypothesis
    const request = userRequest.toLowerCase();
    // Simple pattern matching for hypothesis generation
    let hypothesis = {
        originalRequest: userRequest,
        interpretedIntent: '',
        relevantDataSources: [],
        confidence: 0,
        needsClarification: false,
    };
    // Traffic-related patterns
    if (request.includes('pv') || request.includes('ページビュー') || request.includes('アクセス')) {
        hypothesis.interpretedIntent = 'ページビュー（PV）の推移や傾向を知りたい';
        hypothesis.relevantDataSources = ['ga', 'trends'];
        hypothesis.confidence = 0.8;
    }
    // Search-related patterns
    else if (request.includes('検索') || request.includes('キーワード') || request.includes('seo')) {
        hypothesis.interpretedIntent = '検索パフォーマンス（キーワード、順位、CTR）を知りたい';
        hypothesis.relevantDataSources = ['gsc'];
        hypothesis.confidence = 0.85;
    }
    // User-related patterns
    else if (request.includes('ユーザー') || request.includes('セッション')) {
        hypothesis.interpretedIntent = 'ユーザー数やセッション数の推移を知りたい';
        hypothesis.relevantDataSources = ['ga', 'user-segments'];
        hypothesis.confidence = 0.75;
    }
    // General patterns
    else if (request.includes('どう') || request.includes('調子') || request.includes('状況')) {
        hypothesis.interpretedIntent = 'サイト全体のパフォーマンス概要を知りたい';
        hypothesis.relevantDataSources = ['ga', 'gsc', 'trends'];
        hypothesis.confidence = 0.6;
        hypothesis.needsClarification = true;
    }
    // Default
    else {
        hypothesis.interpretedIntent = 'サイトのアナリティクスデータを確認したい';
        hypothesis.relevantDataSources = ['ga'];
        hypothesis.confidence = 0.5;
        hypothesis.needsClarification = true;
    }
    // Adjust confidence based on previous answers
    if (previousAnswers.length > 0) {
        hypothesis.confidence = Math.min(0.95, hypothesis.confidence + 0.15 * previousAnswers.length);
        hypothesis.needsClarification = hypothesis.confidence < 0.8;
    }
    return JSON.stringify(hypothesis, null, 2);
}
async function handleAskClarifyingQuestions(args) {
    const { hypothesis, answeredQuestions = [] } = args;
    const allQuestions = [
        {
            id: 'period',
            question: 'どの期間のデータを確認しますか？',
            options: [
                { label: '過去7日間', value: '7d' },
                { label: '過去30日間', value: '30d' },
                { label: '過去90日間', value: '90d' },
            ],
        },
        {
            id: 'metrics',
            question: '注目したい指標は何ですか？',
            options: [
                { label: 'トラフィック（PV、セッション）', value: 'traffic' },
                { label: 'SEO（検索順位、CTR）', value: 'seo' },
                { label: 'コンバージョン', value: 'conversion' },
                { label: 'エンゲージメント', value: 'engagement' },
            ],
        },
        {
            id: 'scope',
            question: '分析の範囲を教えてください',
            options: [
                { label: 'サイト全体', value: 'all' },
                { label: 'Partner Lab記事のみ', value: 'lab' },
                { label: '特定のページ', value: 'specific' },
            ],
        },
        {
            id: 'comparison',
            question: '比較データは必要ですか？',
            options: [
                { label: '前の期間と比較', value: 'previous' },
                { label: '前年同期と比較', value: 'yoy' },
                { label: '比較なし', value: 'none' },
            ],
        },
    ];
    // Filter out already answered questions
    const unansweredQuestions = allQuestions.filter((q) => !answeredQuestions.includes(q.id));
    // Return 1-3 questions based on confidence
    const questionCount = hypothesis.confidence < 0.6 ? 3 : hypothesis.confidence < 0.8 ? 2 : 1;
    const selectedQuestions = unansweredQuestions.slice(0, questionCount);
    return JSON.stringify({
        questions: selectedQuestions,
        currentConfidence: hypothesis.confidence,
        needsMoreClarification: selectedQuestions.length > 0 && hypothesis.confidence < 0.8,
    }, null, 2);
}
async function handleGenerateSheetData(args) {
    const { command, dataSources = ['ga', 'gsc'] } = args;
    // Call the existing sheet-ai endpoint
    try {
        const response = await fetch(`${API_BASE_URL}/api/analytics/sheet-ai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                command,
                dataSources,
            }),
        });
        if (!response.ok) {
            throw new Error(`Sheet AI API error: ${response.status}`);
        }
        const data = await response.json();
        return JSON.stringify(data, null, 2);
    }
    catch (error) {
        // Return fallback demo data
        return JSON.stringify({
            columns: ['A', 'B', 'C'],
            rows: [
                { A: '日付', B: 'PV', C: '前週比' },
                { A: '1/8', B: 1520, C: '+5.2%' },
                { A: '1/9', B: 1480, C: '+3.1%' },
                { A: '1/10', B: 1650, C: '+8.7%' },
            ],
            chart: {
                type: 'line',
                dataKeys: ['B'],
                xAxisKey: 'A',
                title: 'Demo Data',
            },
            summary: 'デモデータです。実際のAPIが利用可能な場合は実データが表示されます。',
            demo: true,
        }, null, 2);
    }
}
// Create and start the server
const server = new Server({
    name: 'analytics-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
}));
// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        let result;
        switch (name) {
            case 'fetch_analytics_data':
                result = await handleFetchAnalyticsData(args);
                break;
            case 'generate_hypothesis':
                result = await handleGenerateHypothesis(args);
                break;
            case 'ask_clarifying_questions':
                result = await handleAskClarifyingQuestions(args);
                break;
            case 'generate_sheet_data':
                result = await handleGenerateSheetData(args);
                break;
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
        return {
            content: [
                {
                    type: 'text',
                    text: result,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({ error: String(error) }),
                },
            ],
            isError: true,
        };
    }
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Analytics MCP Server started');
}
main().catch(console.error);
