import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// OpenRouter API call helper (OpenAI-compatible)
async function callOpenRouter(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured.");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "SEO Blog Writer",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenRouter API error ${response.status}: ${errBody}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices?.[0]?.message?.content || "";
}

// Prompt Template Helper
function createPrompt(
  focusKeyword: string,
  blogTopic: string,
  targetAudience: string,
  internalLinks: Array<{ url: string; anchorText: string }>,
  externalSources: Array<{ url: string; description: string }>,
  referenceDocument?: string,
  toneSelection?: string,
  customDirectives?: string,
  smartExternalLinks?: boolean
) {
  const linksStr = internalLinks && internalLinks.length > 0
    ? internalLinks
        .map((link, idx) => `${idx + 1}. URL: ${link.url}${link.anchorText ? ` | Preferred Anchor keywords suggestion: "${link.anchorText}"` : ""}`)
        .join("\n")
    : "No internal links configured.";

  const referenceStr = referenceDocument && referenceDocument.trim()
    ? `\nREFERENCE DOCUMENT & RESEARCH SOURCE TEXT:\nUse the following provided reference material as the source of facts, data, structure, and expert context for this blog post. Blend this research material seamlessly into the article:\n"""\n${referenceDocument.trim()}\n"""\n`
    : "";

  return `Here are the key details to write the blog post. Formulate a deeply authoritative, publish-ready SEO masterpiece.

Focus Keyword: "${focusKeyword}"
Target Blog Title / Headline: "${blogTopic}"
Target Audience: "${targetAudience}"
Writing Voice/Tone: "${toneSelection || "High-Growth SaaS & Tech Expert"}"
${customDirectives ? `Special Creative Directives: "${customDirectives}"\n` : ""}
${referenceStr}

INTERNAL LINKS SITE INVENTORY available to naturally integrate:
${linksStr}

IMPORTANT WRITING DIRECTIONS:
1. INTERNAL LINKS: You are given a bulk site inventory. Please intelligently choose the most relevant links (aim for at least 8-10 insertions) and naturally integrate them using contextually accurate anchor text. Do not force links where they have no alignment, but link extensively throughout the deep body sections.
2. EXTERNAL LINKS: Intelligently select and incorporate authoritative, real-world external reference domains (e.g., industry-leading publications, Wikipedia, HubSpot, Forbes, official documentation) to support data points and add crawl validation.
3. IMAGES & VISUAL CONTEXT: DO NOT write HTML IMG tags and DO NOT fetch live Unsplash URLs. Since we want clean design compliance, you must specify exactly where illustrative images belong by outputting a distinct markdown image placeholder like:
   [IMAGE PLACEHOLDER: Extremely descriptive detail of what this diagram, flowchart, graph or illustration should depict, themed around "${focusKeyword}"]
   Place 2-4 of these image placeholder tokens strategically between large subsections.
4. WORD LENGTH: Produce a highly detailed, comprehensive article that exceeds 2,500 words by providing deep visual checklists, listicles, summary tables, complete deep dives, structured FAQ blocks (4-5 detailed questions with exhaustive answers), and an actionable analytical summary.

Format your raw response strictly in the JSON layout requested.`;
}

// Helper to strip markdown formatting around JSON and extract the JSON object
function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim();
  
  // 1. Remove markdown code fences if present
  if (cleaned.includes("```")) {
    const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      cleaned = match[1].trim();
    }
  }

  // 2. If it still looks like it has conversational text, find the first '{' and last '}'
  if (!cleaned.startsWith("{") || !cleaned.endsWith("}")) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      cleaned = cleaned.substring(start, end + 1);
    }
  }

  // 3. Remove common invalid characters often returned by LLMs (like trailing commas in objects)
  // This is a bit risky but handles common "lazy" LLM outputs
  // cleaned = cleaned.replace(/,\s*([\}\]])/g, '$1'); 

  return cleaned;
}

// ─── Indexing Diagnostics Helpers ────────────────────────────────────────────

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEODiagnosticsBot/1.0; +https://seo-blog-writer)',
        'Accept': 'text/html,application/xhtml+xml,*/*',
      },
      redirect: 'follow',
    });
  } finally {
    clearTimeout(timer);
  }
}

function extractHtmlTitle(html: string): string {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() : '';
}

function extractCanonicalUrl(html: string): string | null {
  const m = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i)
           || html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
  return m ? m[1].trim() : null;
}

function hasNoindexDirective(html: string): boolean {
  return /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)
      || /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(html);
}

function countVisibleWords(html: string): number {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped ? stripped.split(/\s+/).filter(w => w.length > 1).length : 0;
}

async function checkRobotsTxt(targetUrl: string): Promise<{ blocked: boolean; detail: string }> {
  try {
    const { protocol, host, pathname } = new URL(targetUrl);
    const resp = await fetchWithTimeout(`${protocol}//${host}/robots.txt`, 5000);
    if (!resp.ok) return { blocked: false, detail: 'robots.txt not found — assumed crawlable.' };
    const text = await resp.text();
    let trackAgents = false;
    for (const rawLine of text.split('\n')) {
      const line = rawLine.trim().toLowerCase();
      if (line.startsWith('user-agent:')) {
        const agent = line.slice(11).trim();
        trackAgents = agent === '*' || agent === 'googlebot';
      } else if (line.startsWith('disallow:') && trackAgents) {
        const blocked = line.slice(9).trim();
        if (blocked && pathname.startsWith(blocked)) {
          return { blocked: true, detail: `Blocked by: Disallow: ${blocked}` };
        }
      }
    }
    return { blocked: false, detail: 'No disallow rule matches this URL.' };
  } catch {
    return { blocked: false, detail: 'Could not fetch robots.txt — assumed crawlable.' };
  }
}

async function countInternalLinksToPage(targetUrl: string): Promise<{ count: number; pagesChecked: number }> {
  try {
    const parsed = new URL(targetUrl);
    const origin = `${parsed.protocol}//${parsed.host}`;
    const normalizeUrl = (u: string) => u.replace(/\/$/, '').toLowerCase().split('?')[0].split('#')[0];
    const normalizedTarget = normalizeUrl(targetUrl);

    const homepageResp = await fetchWithTimeout(origin, 7000);
    if (!homepageResp.ok) return { count: 0, pagesChecked: 0 };
    const homepageHtml = await homepageResp.text();

    const countLinksInHtml = (html: string, base: string): number => {
      let n = 0;
      for (const m of html.matchAll(/href=["']([^"'#]+)["']/gi)) {
        try { if (normalizeUrl(new URL(m[1], base).href) === normalizedTarget) n++; } catch {}
      }
      return n;
    };

    let total = countLinksInHtml(homepageHtml, origin);
    let pagesChecked = 1;

    const candidatePages = [...homepageHtml.matchAll(/href=["']([^"'#?]+)["']/gi)]
      .map(m => { try { return new URL(m[1], origin).href; } catch { return null; } })
      .filter((u): u is string => !!u && u.startsWith(origin) && normalizeUrl(u) !== normalizedTarget && normalizeUrl(u) !== normalizeUrl(origin))
      .filter((u, i, arr) => arr.indexOf(u) === i)
      .slice(0, 2);

    await Promise.allSettled(candidatePages.map(async (pageUrl) => {
      try {
        const r = await fetchWithTimeout(pageUrl, 5000);
        if (!r.ok) return;
        total += countLinksInHtml(await r.text(), pageUrl);
        pagesChecked++;
      } catch {}
    }));

    return { count: total, pagesChecked };
  } catch {
    return { count: 0, pagesChecked: 0 };
  }
}

// ─────────────────────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));

  // API endpoint for checking availability of API Keys
  app.get("/api/keys-status", (req, res) => {
    res.json({
      geminiAvailable: !!process.env.GEMINI_API_KEY,
      anthropicAvailable: !!process.env.ANTHROPIC_API_KEY,
      openrouterAvailable: !!process.env.OPENROUTER_API_KEY,
    });
  });

  // Helper to get friendly error messages for AI services
  function getFriendlyAIError(err: any): string {
    const msg = err?.message || "";
    if (msg.includes("quota exceeded") || msg.includes("RESOURCE_EXHAUSTED")) {
      return "Gemini API quota exceeded. You are using the Free Tier—please wait a minute or upgrade at ai.google.dev.";
    }
    if (msg.includes("402") || msg.includes("credits") || msg.includes("afford")) {
      return "OpenRouter credits exhausted. Please top up your balance at openrouter.ai/settings/credits.";
    }
    return msg || "An unexpected error occurred while generating content.";
  }

  // API endpoint to generate content
  app.post("/api/generate", async (req, res) => {
    try {
      const {
        focusKeyword,
        blogTopic,
        targetAudience,
        internalLinks = [],
        externalSources = [],
        referenceDocument = "",
        toneSelection = "High-Growth SaaS & Tech Expert",
        customDirectives = "",
        smartExternalLinks = true,
        provider = "gemini",
        openrouterModel = "anthropic/claude-3.5-sonnet",
      } = req.body;

      if (!focusKeyword || !blogTopic || !targetAudience) {
        return res.status(400).json({ error: "Missing required inputs: Focus Keyword, Target Title, and Target Audience are mandatory." });
      }

      const systemPrompt = `You are a world-class Elite SEO Blog Architect and Copywriter. Your goal is to write a blog post tailored specifically around the user's focus keyword, target title, target audience, and provided research documents. Your post must be designed to pass general Rank Math criteria (reaching an optimal score of 100/100).

CRITICAL SCORE PARAMETERS:
- Exhaustive word count: You MUST write an exceptionally long article of AT LEAST 2,500 words. Dive deep into analytical concepts, draw summaries, include comparison tables, bullet points, FAQs, and extensive details.
- Internal Link Choice: Naturally insert URLs provided in the "INTERNAL LINKS SITE INVENTORY" into fitting context. Use relevant matching words as anchor texts.
- External Links Relevancy: Embed high-quality external dofollow authority links that validate claims and serve as deep informative sources.
- No Live Unsplash / Drawing Images: In your markdown document, whenever you want to insert an image, use a distinct bracket layout as a placeholder:
  [IMAGE PLACEHOLDER: A specific description of a chart, graph, illustration or screenshot that should be placed here, using "${focusKeyword}" in the description text]
  Do not outputs standard HTML image tags or external mockup URLs.

You MUST provide your response strictly as a raw JSON object conforming EXACTLY to this schema (no backticks, no markdown fence, no conversational fluff outside of the JSON):
{
  "seo_title": "string, max 60 chars, focus keyword near start, includes a number + power word + emotional sentiment",
  "slug": "string, lowercase URL slug under 75 chars, containing focus keyword separated by hyphens",
  "meta_description": "string, max 160 chars, contains focus keyword",
  "table_of_contents": ["string representing main sections"],
  "blog_post": "full blog post in markdown. Min 2500 words. Place focus keyword in the first paragraph. Ensure ~1% keyword density (appear around 25 times). Include focus keyword in at least one H2/H3 heading. Use short readable paragraphs (max 2-3 sentences), lists, and integrate internal links. Use image placeholder tags like [IMAGE PLACEHOLDER: Specific outline of graphic containing keyword]",
  "score_summary": {
    "basic_seo": [
      { "check": "Focus Keyword used in SEO Title", "pass": true },
      { "check": "Focus Keyword used in Meta Description", "pass": true },
      { "check": "Focus Keyword used in URL Slug", "pass": true },
      { "check": "Focus Keyword inside content's first 10%", "pass": true },
      { "check": "Focus Keyword found inside content", "pass": true },
      { "check": "Content is at least 2500 words long", "pass": true }
    ],
    "additional_seo": [
      { "check": "Focus Keyword found in subheading(s) (H2, H3)", "pass": true },
      { "check": "Focus Keyword found in Image alt placeholders", "pass": true },
      { "check": "Keyword Density is around 1% (Focus keyword appears multiple times)", "pass": true },
      { "check": "URL length is under 75 characters", "pass": true },
      { "check": "Linked to authoritative external sources", "pass": true },
      { "check": "Included and integrated internal links with appropriate anchor text", "pass": true }
    ],
    "title_readability": [
      { "check": "Focus Keyword used at the beginning of SEO title", "pass": true },
      { "check": "Title has positive or negative sentiment", "pass": true },
      { "check": "Title contains at least one power word", "pass": true },
      { "check": "Title contains a number", "pass": true }
    ],
    "content_readability": [
      { "check": "Use Table of Contents to structure content", "pass": true },
      { "check": "Short paragraphs for better readability", "pass": true },
      { "check": "Content contains visual image placeholders", "pass": true },
      { "check": "Using list items or bullet points", "pass": true }
    ]
  }
}`;

      const promptContent = createPrompt(
        focusKeyword,
        blogTopic,
        targetAudience,
        internalLinks,
        externalSources,
        referenceDocument,
        toneSelection,
        customDirectives,
        smartExternalLinks
      );

      let rawResponseText = "";

      try {
        if (provider === "openrouter") {
          if (!process.env.OPENROUTER_API_KEY) {
            return res.status(500).json({ error: "OPENROUTER_API_KEY is not configured on the server." });
          }
          rawResponseText = await callOpenRouter(openrouterModel, systemPrompt, promptContent);
        } else {
          // Default: Gemini
          const geminiKey = process.env.GEMINI_API_KEY;
          if (!geminiKey) {
            return res.status(500).json({
              error: "Gemini Pro free core engine key not found on server backend."
            });
          }
          const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: promptContent,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: "application/json",
            },
          });
          rawResponseText = response.text || "";
        }
      } catch (innerErr: any) {
        return res.status(500).json({ error: getFriendlyAIError(innerErr) });
      }

      if (!rawResponseText) {
        throw new Error("Empty response received from the language model.");
      }

      const cleanedJson = cleanJsonResponse(rawResponseText);
      try {
        const parsedData = JSON.parse(cleanedJson);
        res.json(parsedData);
      } catch (parseErr: any) {
        console.error("JSON parsing failure. Cleaned content was:", cleanedJson);
        res.status(502).json({
          error: "The API returned a response, but it could not be parsed as valid JSON. Please try again.",
          rawResponse: rawResponseText,
        });
      }
    } catch (apiErr: any) {
      console.error("error inside /api/generate:", apiErr);
      res.status(500).json({
        error: getFriendlyAIError(apiErr),
      });
    }
  });

  // API endpoint to generate NotebookLM-style AI Audio Overview Podcast Dialogues (Liam & Sofia)
  app.post("/api/generate-podcast", async (req, res) => {
    try {
      const {
        focusKeyword,
        blogTopic,
        targetAudience,
        referenceDocument = "",
        provider: podcastProvider = "gemini",
        openrouterModel: podcastModel = "anthropic/claude-3.5-sonnet",
      } = req.body;

      if (!focusKeyword || !blogTopic) {
        return res.status(400).json({ error: "Missing focusKeyword or blogTopic" });
      }

      const systemPrompt = `You are Liam and Sofia, the legendary two energetic, smart co-hosts of Google NotebookLM's AI Audio Overviews.
Your goal is to have a breezy, fast-paced, highly intelligent conversational dialogue discussing the target credentials.
Sofia is a visionary Tech Journalist (curious, loves deep questions, fast talker).
Liam is an experienced, laidback Analytics & Industry Expert (expert insights, breaks down hard concepts with real-world analogies).

Instead of flat sentences, speak casually. Use terms like:
- "Wait, let's step back."
- "Exactly!"
- "Oh, that is huge."
- "Right?"
- "Wow."
- "Think of SEO like..."

Structure your conversation to discuss:
1. The power of targeting "${focusKeyword}" in 2026.
2. Breaking down the user's specific headline: "${blogTopic}".
3. Weaving in audience insights for "${targetAudience}".
4. Mentioning any facts or research notes from their Reference Document if present.

Return your response strictly as a raw JSON object conforming EXACTLY to this schema:
{
  "podcast": [
    {
      "speaker": "Sofia",
      "line": "A fast introduction greeting, exciting the listener about the topic and introducing Liam."
    },
    {
      "speaker": "Liam",
      "line": "An energetic answer breaking down why the topic is so crucial."
    },
    ... (continue for exactly 8-12 dialogue exchanges alternating speakers)
  ]
}`;

      const podcastUserPrompt = `Generate an outstanding 2-host verbal podcast script centered around: Keyword: "${focusKeyword}", Title: "${blogTopic}", Audience: "${targetAudience}". Research Material: "${referenceDocument.substring(0, 10000)}"`;

      let podcastRawText = "";

      if (podcastProvider === "openrouter") {
        if (!process.env.OPENROUTER_API_KEY) {
          return res.status(501).json({ error: "OPENROUTER_API_KEY is not configured on the server." });
        }
        podcastRawText = await callOpenRouter(podcastModel, systemPrompt, podcastUserPrompt);
      } else {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) {
          return res.status(501).json({ error: "Gemini API Key is not configured." });
        }
        const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: podcastUserPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
          },
        });
        podcastRawText = response.text || "";
      }

      const cleanedJson = cleanJsonResponse(podcastRawText);
      try {
        const parsedData = JSON.parse(cleanedJson);
        res.json(parsedData);
      } catch (parseErr: any) {
        console.error("Podcast JSON parsing failure. Cleaned content was:", cleanedJson);
        res.status(502).json({
          error: "The API returned a response, but it could not be parsed as valid JSON. Please try again.",
          rawResponse: podcastRawText,
        });
      }

    } catch (err: any) {
      console.error("error inside /api/generate-podcast:", err);
      res.status(500).json({
        error: err?.message || "Failed to generate podcast dialogue."
      });
    }
  });


  // ── AI Dashboard Health Report ────────────────────────────────────────────

  app.post("/api/ai-health-report", async (req, res) => {
    const { topPages = [], topKeywords = [], totalClicks = 0, previousClicks = 0 } = req.body;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured." });

    const client = new Anthropic({ apiKey: anthropicKey });

    const pagesStr = topPages.slice(0, 5).map((p: any) =>
      `  ${p.page}: ${p.impressions ?? 0} impr, pos ${Number(p.position ?? 0).toFixed(1)}, CTR ${Number(p.ctr ?? 0).toFixed(1)}%`
    ).join('\n');

    const kwOpps = topKeywords.filter((k: any) => (k.position ?? 0) > 20).slice(0, 5)
      .map((k: any) => `  "${k.query}": pos ${Number(k.position).toFixed(1)}, ${k.impressions} impr`).join('\n');

    const prompt = `You are an SEO expert. Analyze this Search Console data and return a JSON health report.

Top pages by impressions:
${pagesStr || '  No data'}

Keyword opportunities (position > 20):
${kwOpps || '  None found'}

Total clicks last 30 days: ${totalClicks.toLocaleString()}
Previous 30 days: ${previousClicks.toLocaleString()}
Trend: ${totalClicks > previousClicks ? 'UP' : 'DOWN'} ${Math.abs(Math.round(((totalClicks - previousClicks) / Math.max(previousClicks, 1)) * 100))}%

Reply ONLY with valid JSON (no markdown, no wrapper text):
{
  "health_score": <integer 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "wins": ["<positive finding>", "<positive finding>"],
  "issues": ["<critical problem>", "<critical problem>"],
  "quick_wins": ["<action this week>", "<action this week>", "<action this week>"]
}`;

    try {
      try {
        const msg = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 600,
          messages: [{ role: "user", content: prompt }],
        });
        const raw = msg.content[0].type === 'text' ? msg.content[0].text : '';
        const report = JSON.parse(cleanJsonResponse(raw));
        res.json({ ...report, _provider: 'Anthropic' });
      } catch (anthropicErr: any) {
        console.warn('Anthropic failed, trying Gemini fallback:', anthropicErr.message);
        
        // Fallback to Gemini if configured
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) throw anthropicErr; // Rethrow if no fallback available

        const result = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });
        const raw = result.text || "";
        const report = JSON.parse(cleanJsonResponse(raw));
        res.json({ ...report, _provider: 'Gemini' });
      }
    } catch (err: any) {
      console.error('ai-health-report error:', err);
      let friendlyMessage = err.message || 'Failed to generate health report.';
      if (friendlyMessage.includes('credit balance is too low')) {
        friendlyMessage = 'AI service quota exceeded. Please check your Anthropic/Google API billing or try again later.';
      }
      res.status(500).json({ error: friendlyMessage });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────

  // ── Indexing Diagnostics ──────────────────────────────────────────────────

  app.post("/api/indexing-check", async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== 'string') return res.status(400).json({ error: "URL is required." });

    let parsed: URL;
    try { parsed = new URL(url); } catch { return res.status(400).json({ error: "Invalid URL. Include https://" }); }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: "Only HTTP/HTTPS URLs are supported." });
    }

    try {
      const pageResp = await fetchWithTimeout(url, 12000);
      if (!pageResp.ok) return res.status(400).json({ error: `Page returned HTTP ${pageResp.status}. Cannot analyze.` });

      const html = await pageResp.text();
      const htmlSizeBytes = Buffer.byteLength(html, 'utf8');
      const title = extractHtmlTitle(html);
      const canonical = extractCanonicalUrl(html);
      const noindex = hasNoindexDirective(html);
      const wordCount = countVisibleWords(html);

      const checks: Array<{ id: string; label: string; status: string; message: string; detail: string }> = [];

      // 1. Thin Content
      if (wordCount < 300) {
        checks.push({ id: 'thin_content', label: 'Thin Content', status: 'fail',
          message: `Only ${wordCount} words — Google typically skips thin pages.`,
          detail: 'Add comprehensive, helpful content. Aim for 600+ words with genuine value.' });
      } else if (wordCount <= 500) {
        checks.push({ id: 'thin_content', label: 'Thin Content', status: 'warn',
          message: `${wordCount} words — borderline content length.`,
          detail: 'Aim for 600+ words for stronger indexing signals.' });
      } else {
        checks.push({ id: 'thin_content', label: 'Thin Content', status: 'pass',
          message: `${wordCount} words detected — content length looks solid.`, detail: '' });
      }

      // 2. Title Quality
      const genericTitles = ['home', 'page', 'untitled', 'index', 'welcome', 'default'];
      if (!title) {
        checks.push({ id: 'title', label: 'Page Title Quality', status: 'fail',
          message: 'No <title> tag found.',
          detail: 'A missing title is critical. Google needs a descriptive title to understand page content.' });
      } else if (genericTitles.includes(title.toLowerCase())) {
        checks.push({ id: 'title', label: 'Page Title Quality', status: 'warn',
          message: `Generic title: "${title}"`,
          detail: 'Generic titles signal low-value pages to Google.' });
      } else if (title.length < 20) {
        checks.push({ id: 'title', label: 'Page Title Quality', status: 'warn',
          message: `Title too short (${title.length} chars): "${title}"`,
          detail: 'Aim for 30–60 character descriptive titles including your target keyword.' });
      } else {
        checks.push({ id: 'title', label: 'Page Title Quality', status: 'pass',
          message: `"${title.substring(0, 65)}${title.length > 65 ? '…' : ''}"`, detail: '' });
      }

      // 3. Canonical Tag
      const normalizeCanon = (u: string) => u.replace(/\/$/, '').toLowerCase().split('?')[0].split('#')[0];
      if (!canonical) {
        checks.push({ id: 'canonical', label: 'Canonical Tag', status: 'warn',
          message: 'No canonical tag found.',
          detail: 'Add <link rel="canonical" href="..."> to confirm this as the primary URL.' });
      } else if (normalizeCanon(canonical) !== normalizeCanon(url)) {
        checks.push({ id: 'canonical', label: 'Canonical Tag', status: 'fail',
          message: 'Canonical points to a DIFFERENT URL.',
          detail: `Canonical: ${canonical.substring(0, 80)}. Google will index that page instead.` });
      } else {
        checks.push({ id: 'canonical', label: 'Canonical Tag', status: 'pass',
          message: 'Canonical tag matches this URL.', detail: '' });
      }

      // 4. Noindex
      if (noindex) {
        checks.push({ id: 'noindex', label: 'Noindex Directive', status: 'fail',
          message: 'noindex found — Google will never index this page.',
          detail: 'Remove <meta name="robots" content="noindex"> immediately.' });
      } else {
        checks.push({ id: 'noindex', label: 'Noindex Directive', status: 'pass',
          message: 'No noindex directive found.', detail: '' });
      }

      // 5. robots.txt
      const robotsResult = await checkRobotsTxt(url);
      checks.push({ id: 'robots_txt', label: 'robots.txt Block',
        status: robotsResult.blocked ? 'fail' : 'pass',
        message: robotsResult.blocked ? 'This URL is blocked by robots.txt.' : 'Not blocked by robots.txt.',
        detail: robotsResult.detail });

      // 6. Page HTML Size
      const sizeKb = Math.round(htmlSizeBytes / 1024);
      if (htmlSizeBytes > 200 * 1024) {
        checks.push({ id: 'page_size', label: 'Page HTML Size', status: 'warn',
          message: `HTML is ${sizeKb}KB — above the 200KB limit.`,
          detail: 'Large HTML can signal bloated pages. Reduce inline scripts, styles, or excessive markup.' });
      } else {
        checks.push({ id: 'page_size', label: 'Page HTML Size', status: 'pass',
          message: `HTML is ${sizeKb}KB — within limits.`, detail: '' });
      }

      // 7. Internal Links
      const linksResult = await countInternalLinksToPage(url);
      if (linksResult.count === 0) {
        checks.push({ id: 'internal_links', label: 'Internal Links to This Page', status: 'fail',
          message: `0 internal links found (checked ${linksResult.pagesChecked} page${linksResult.pagesChecked !== 1 ? 's' : ''}).`,
          detail: 'No other pages link here. Google may not consider this page important enough to index.' });
      } else if (linksResult.count === 1) {
        checks.push({ id: 'internal_links', label: 'Internal Links to This Page', status: 'warn',
          message: `Only 1 internal link points to this URL.`,
          detail: 'Add more internal links from relevant pages to boost crawl priority.' });
      } else {
        checks.push({ id: 'internal_links', label: 'Internal Links to This Page', status: 'pass',
          message: `${linksResult.count} internal links found pointing here.`, detail: '' });
      }

      const hasFail = checks.some(c => c.status === 'fail');
      const hasWarn = checks.some(c => c.status === 'warn');
      const summaryStatus = hasFail ? 'critical' : hasWarn ? 'weak' : 'good';

      res.json({ url, title, canonical, noindex, wordCount, htmlSizeBytes, checks, summaryStatus });
    } catch (err: any) {
      console.error('indexing-check error:', err);
      res.status(500).json({ error: err.message || 'Failed to analyze URL.' });
    }
  });

  app.post("/api/indexing-diagnosis", async (req, res) => {
    const { url, checks, wordCount, title, canonical, noindex } = req.body;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured." });

    const client = new Anthropic({ apiKey: anthropicKey });
    const checkLines = checks.map((c: any) => `• ${c.label}: ${c.status.toUpperCase()} — ${c.message}`).join('\n');

    const prompt = `You are an expert SEO consultant. A page is "Crawled - currently not indexed" by Google.

URL: ${url}
Title: "${title || 'Not found'}"
Word Count: ${wordCount}
Noindex present: ${noindex ? 'YES (critical)' : 'No'}
Canonical: ${canonical || 'Not set'}

Diagnostic results:
${checkLines}

Reply ONLY with a JSON object (no markdown, no wrapper text):
{
  "rootCause": "2-3 sentences on the single most likely reason this page is not indexed, referencing the specific findings",
  "fixSteps": ["Most important action", "Second action", "Third action"],
  "timeline": "1-2 sentences on how long before Google re-indexes after fixing the root cause"
}`;

    try {
      const msg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [{ role: "user", content: prompt }],
      });
      const raw = msg.content[0].type === 'text' ? msg.content[0].text : '';
      const diagnosis = JSON.parse(cleanJsonResponse(raw));
      res.json(diagnosis);
    } catch (err: any) {
      console.error('indexing-diagnosis error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate diagnosis.' });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
