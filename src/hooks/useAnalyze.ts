import { useState, useEffect, useCallback, useRef } from "react";
import { BlogOutput, InternalLinkPair, IndexingResults, IndexingDiagnosis } from "../types";

const INITIAL_BULK_LINKS = `https://myblog.com/seo-basics | SEO fundamentals
https://myblog.com/content-strategy | content marketing playbooks
https://myblog.com/on-page-seo | on-page optimization tips
https://myblog.com/link-building | authoritative link building
https://myblog.com/keyword-research | advanced keyword discovery
https://myblog.com/b2b-saas-guide | B2B SaaS growth funnel
https://myblog.com/conversion-rate-optimization | CRO tactics
https://myblog.com/email-marketing-automation | automated email workflows
https://myblog.com/customer-churn-reduction | retaining platform users
https://myblog.com/marketing-analytics | data-driven metrics`;

export function useAnalyze() {
  // Model settings
  const [provider, setProvider] = useState<"gemini" | "openrouter">("gemini");
  const [openrouterModel, setOpenrouterModel] = useState("anthropic/claude-3.5-sonnet");
  const [keysConfig, setKeysConfig] = useState({ geminiAvailable: true, openrouterAvailable: false });

  // NotebookLM Simulated Audio Podcast States
  const [podcastScript, setPodcastScript] = useState<Array<{ speaker: string; line: string }> | null>(null);
  const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
  const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
  const [currentPodcastLineIdx, setCurrentPodcastLineIdx] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [podcastError, setPodcastError] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const simulationTimerRef = useRef<any>(null);

  // Core inputs
  const [focusKeyword, setFocusKeyword] = useState("SaaS marketing strategies");
  const [blogTopic, setBlogTopic] = useState("10 Pro SaaS Marketing Strategies to Skyrocket Growth in 2026");
  const [targetAudience, setTargetAudience] = useState("SaaS Founders, CMOs, and Marketing Managers");
  
  // Advanced controls
  const [internalLinksText, setInternalLinksText] = useState(INITIAL_BULK_LINKS);
  const [referenceDocument, setReferenceDocument] = useState("");
  const [toneSelection, setToneSelection] = useState("High-Growth SaaS & Tech Expert");
  const [customDirectives, setCustomDirectives] = useState("");
  const [smartExternalLinks, setSmartExternalLinks] = useState(true);

  // UI States
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Clear error when model or provider changes, and handle auto-clear
  useEffect(() => {
    setErrorText(null);
  }, [provider, openrouterModel]);

  useEffect(() => {
    if (errorText) {
      const timer = setTimeout(() => setErrorText(null), 10000); // Auto-clear after 10s
      return () => clearTimeout(timer);
    }
  }, [errorText]);
  const [isRefining, setIsRefining] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState("");

  // Outputs
  const [generatedOutput, setGeneratedOutput] = useState<BlogOutput | null>(null);
  const [editedBlogPost, setEditedBlogPost] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "blog" | "score" | "notebooklm" | "json" | "indexing" | "config">("overview");
  const [previewMode, setPreviewMode] = useState<"split" | "editor" | "preview">("split");

  // Indexing Diagnostics
  const [indexingUrl, setIndexingUrl] = useState("");
  const [isCheckingIndex, setIsCheckingIndex] = useState(false);
  const [indexingResults, setIndexingResults] = useState<IndexingResults | null>(null);
  const [indexingError, setIndexingError] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [indexingDiagnosis, setIndexingDiagnosis] = useState<IndexingDiagnosis | null>(null);

  // Fetch API keys and load saved state
  useEffect(() => {
    fetch("/api/keys-status")
      .then((res) => res.json())
      .then((data) => setKeysConfig(data))
      .catch((err) => console.log("Keys verification failed:", err));

    const savedKeyword = localStorage.getItem("seo_focusKeyword");
    const savedTopic = localStorage.getItem("seo_blogTopic");
    const savedAudience = localStorage.getItem("seo_targetAudience");
    const savedLinksText = localStorage.getItem("seo_internalLinksText");
    const savedReference = localStorage.getItem("seo_referenceDocument");
    const savedTone = localStorage.getItem("seo_toneSelection");
    const savedDirectives = localStorage.getItem("seo_customDirectives");
    const savedDraft = localStorage.getItem("seo_activeDraftPayload");

    if (savedKeyword) setFocusKeyword(savedKeyword);
    if (savedTopic) setBlogTopic(savedTopic);
    if (savedAudience) setTargetAudience(savedAudience);
    if (savedLinksText) setInternalLinksText(savedLinksText);
    if (savedReference) setReferenceDocument(savedReference);
    if (savedTone) setToneSelection(savedTone);
    if (savedDirectives) setCustomDirectives(savedDirectives);
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setGeneratedOutput(parsedDraft);
        setEditedBlogPost(parsedDraft.blog_post);
      } catch (e) {}
    }
  }, []);

  // Save state on change
  useEffect(() => {
    localStorage.setItem("seo_focusKeyword", focusKeyword);
    localStorage.setItem("seo_blogTopic", blogTopic);
    localStorage.setItem("seo_targetAudience", targetAudience);
    localStorage.setItem("seo_internalLinksText", internalLinksText);
    localStorage.setItem("seo_referenceDocument", referenceDocument);
    localStorage.setItem("seo_toneSelection", toneSelection);
    localStorage.setItem("seo_customDirectives", customDirectives);
    if (generatedOutput) {
      localStorage.setItem("seo_activeDraftPayload", JSON.stringify({
        ...generatedOutput,
        blog_post: editedBlogPost
      }));
    }
  }, [focusKeyword, blogTopic, targetAudience, internalLinksText, referenceDocument, toneSelection, customDirectives, editedBlogPost, generatedOutput]);

  const parseBulkLinks = useCallback((): InternalLinkPair[] => {
    if (!internalLinksText.trim()) return [];
    return internalLinksText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        if (line.includes("|")) {
          const parts = line.split("|");
          return { url: parts[0].trim(), anchorText: parts[1]?.trim() || "" };
        }
        return { url: line, anchorText: "" };
      });
  }, [internalLinksText]);

  const handleResetInputs = () => {
    if (window.confirm("Restore original templates?")) {
      setFocusKeyword("SaaS marketing strategies");
      setBlogTopic("10 Pro SaaS Marketing Strategies to Skyrocket Growth in 2026");
      setTargetAudience("SaaS Founders, CMOs, and Marketing Managers");
      setInternalLinksText(INITIAL_BULK_LINKS);
      setReferenceDocument("");
      setToneSelection("High-Growth SaaS & Tech Expert");
      setCustomDirectives("");
      setSmartExternalLinks(true);
    }
  };

  const handleGenerateBlog = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorText(null);

    if (!focusKeyword.trim() || !blogTopic.trim() || !targetAudience.trim()) {
      setErrorText("Required fields missing.");
      return;
    }

    const parsedLinks = parseBulkLinks();
    if (parsedLinks.length === 0) {
      setErrorText("Please supply at least 1-2 site internal links.");
      return;
    }

    setIsGenerating(true);
    setGeneratedOutput(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focusKeyword, blogTopic, targetAudience, internalLinks: parsedLinks,
          referenceDocument, toneSelection, customDirectives, smartExternalLinks,
          provider, openrouterModel,
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed.");

      setGeneratedOutput(data);
      setEditedBlogPost(data.blog_post);
      setActiveTab("blog");
      setPreviewMode("split");
    } catch (err: any) {
      setErrorText(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCoPilotRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinePrompt.trim() || !editedBlogPost) return;

    setIsRefining(true);
    setErrorText(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focusKeyword, blogTopic, targetAudience, internalLinks: parseBulkLinks(),
          referenceDocument: `CURRENT ACTIVE OUTLINE TO POLISH:\n${editedBlogPost}\n`,
          toneSelection,
          customDirectives: `REVISION DIRECTIVE FROM EDITOR: "${refinePrompt}". Maintain the complete text depth, keep the structural markdown, and return back the revised blog outline content conforming exactly to JSON format schema.`,
          smartExternalLinks, provider, openrouterModel,
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Polisher failed.");

      setGeneratedOutput(data);
      setEditedBlogPost(data.blog_post);
      setRefinePrompt("");
    } catch (err: any) {
      setErrorText(`Refiner failed: ${err.message}`);
    } finally {
      setIsRefining(false);
    }
  };

  const handleGeneratePodcast = async () => {
    setIsGeneratingPodcast(true);
    setPodcastError(null);
    setCurrentPodcastLineIdx(0);
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    setIsPlayingPodcast(false);

    try {
      const response = await fetch("/api/generate-podcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focusKeyword, blogTopic, targetAudience, referenceDocument, provider, openrouterModel })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Podcast failed.");
      setPodcastScript(data.podcast || []);
    } catch (err: any) {
      setPodcastError(err.message);
    } finally {
      setIsGeneratingPodcast(false);
    }
  };

  const speakPodcastLine = useCallback((index: number) => {
    if (!podcastScript || index >= podcastScript.length) {
      setIsPlayingPodcast(false);
      setCurrentPodcastLineIdx(0);
      return;
    }
    setCurrentPodcastLineIdx(index);
    const lineObj = podcastScript[index];

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(lineObj.line);
      const voices = window.speechSynthesis.getVoices();
      
      if (lineObj.speaker === "Sofia") {
        u.pitch = 1.15;
        u.rate = 1.05 * playbackSpeed;
        const voice = voices.find(v => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("google us english") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("samantha"));
        if (voice) u.voice = voice;
      } else {
        u.pitch = 0.90;
        u.rate = 1.0 * playbackSpeed;
        const voice = voices.find(v => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("microsoft david"));
        if (voice) u.voice = voice;
      }

      u.onend = () => speakPodcastLine(index + 1);
      u.onerror = () => {
        const words = lineObj.line.split(" ").length;
        simulationTimerRef.current = setTimeout(() => speakPodcastLine(index + 1), Math.max(((words / 150) * 60 * 1000) / playbackSpeed, 2000));
      };
      utteranceRef.current = u;
      window.speechSynthesis.speak(u);
    }
  }, [podcastScript, playbackSpeed]);

  const togglePlayPodcast = () => {
    if (!podcastScript) return;
    if (isPlayingPodcast) {
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
      if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
      setIsPlayingPodcast(false);
    } else {
      setIsPlayingPodcast(true);
      speakPodcastLine(currentPodcastLineIdx);
    }
  };

  const handleIndexingCheck = async () => {
    if (!indexingUrl.trim()) return;
    setIsCheckingIndex(true);
    setIndexingResults(null);
    setIndexingError(null);
    setIndexingDiagnosis(null);
    try {
      const response = await fetch("/api/indexing-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: indexingUrl.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Check failed.");
      setIndexingResults(data);
    } catch (err: any) {
      setIndexingError(err.message);
    } finally {
      setIsCheckingIndex(false);
    }
  };

  const handleIndexingDiagnosis = async () => {
    if (!indexingResults) return;
    setIsDiagnosing(true);
    setIndexingError(null);
    try {
      const response = await fetch("/api/indexing-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: indexingResults.url,
          checks: indexingResults.checks,
          wordCount: indexingResults.wordCount,
          title: indexingResults.title,
          canonical: indexingResults.canonical,
          noindex: indexingResults.noindex,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Diagnosis failed.");
      setIndexingDiagnosis(data);
    } catch (err: any) {
      setIndexingError(`AI Diagnosis failed: ${err.message}`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const stats = (() => {
    const text = editedBlogPost || "";
    const title = (generatedOutput?.seo_title || blogTopic || "").trim();
    const meta = (generatedOutput?.meta_description || "").trim();
    const slug = (generatedOutput?.slug || "").trim();
    const kw = focusKeyword.trim();
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    
    // 1. Title Checks
    const titleHasKw = title.toLowerCase().includes(kw.toLowerCase());
    const titleKwStart = title.toLowerCase().indexOf(kw.toLowerCase()) < 10;
    const titleLengthOk = title.length >= 40 && title.length <= 60;

    // 2. Meta Checks
    const metaHasKw = meta.toLowerCase().includes(kw.toLowerCase());
    const metaLengthOk = meta.length >= 120 && meta.length <= 160;

    // 3. Content Checks
    const regex = new RegExp(kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), "gi");
    const kwFreq = kw ? (text.match(regex) || []).length : 0;
    const density = wordCount > 0 ? (kwFreq / wordCount) * 100 : 0;
    const firstPara = text.slice(0, 1000).toLowerCase();
    const kwInFirstPara = kw && firstPara.includes(kw.toLowerCase());
    
    const headings = (text.match(/^(?:##|###)\s+(.*)$/gm) || []);
    const kwInHeadings = kw && headings.some(h => h.toLowerCase().includes(kw.toLowerCase()));
    const h1Count = (text.match(/^#\s+(.*)$/gm) || []).length;
    
    // 4. Link Checks
    const linksList = parseBulkLinks();
    const internalLinksFound = linksList.filter(l => text.toLowerCase().includes(l.url.toLowerCase()));
    const externalLinksFound = (text.match(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g) || [])
      .filter(l => !l.includes(window.location.hostname));

    // 5. Image Checks
    const images = (text.match(/\[IMAGE\s+PLACEHOLDER:\s*([^\]]+)\]/gi) || []);
    const imagesWithKw = images.filter(img => img.toLowerCase().includes(kw.toLowerCase()));

    const checks = [
      {
        id: 'title_kw',
        label: 'Focus Keyword in Title',
        status: titleHasKw ? 'pass' : 'fail',
        evidence: titleHasKw ? `Found in: "${title}"` : 'Keyword not found in title.',
        fix: 'Add the focus keyword to your SEO title.'
      },
      {
        id: 'title_start',
        label: 'Keyword at Beginning of Title',
        status: titleKwStart ? 'pass' : 'warn',
        evidence: titleKwStart ? 'Keyword appears near the start.' : 'Keyword is too far from the beginning.',
        fix: 'Move the focus keyword to the first 2-3 words of the title.'
      },
      {
        id: 'meta_kw',
        label: 'Focus Keyword in Meta Description',
        status: metaHasKw ? 'pass' : 'fail',
        evidence: metaHasKw ? 'Keyword found in meta description.' : 'Meta description missing keyword.',
        fix: 'Integrate the focus keyword naturally into the meta description.'
      },
      {
        id: 'slug_kw',
        label: 'Focus Keyword in URL Slug',
        status: kw && slug.toLowerCase().includes(kw.replace(/\s+/g, '-').toLowerCase()) ? 'pass' : 'fail',
        evidence: slug ? `Slug: /${slug}` : 'No slug defined.',
        fix: 'Ensure the URL slug contains the focus keyword separated by hyphens.'
      },
      {
        id: 'first_para',
        label: 'Keyword in First Paragraph',
        status: kwInFirstPara ? 'pass' : 'warn',
        evidence: kwInFirstPara ? 'Keyword found in the introduction.' : 'Introduction lacks focus keyword.',
        fix: 'Mention the focus keyword within the first 2-3 sentences.'
      },
      {
        id: 'density',
        label: 'Keyword Density',
        status: density >= 0.5 && density <= 2.5 ? 'pass' : (density > 2.5 ? 'fail' : 'warn'),
        evidence: `Density: ${density.toFixed(2)}% (${kwFreq} occurrences)`,
        fix: density > 2.5 ? 'Reduce keyword usage to avoid stuffing.' : 'Increase keyword frequency slightly.'
      },
      {
        id: 'heading_kw',
        label: 'Keyword in H2/H3 Headings',
        status: kwInHeadings ? 'pass' : 'warn',
        evidence: kwInHeadings ? 'Found in subheadings.' : 'Subheadings lack focus keyword.',
        fix: 'Add the focus keyword to at least one H2 or H3 heading.'
      },
      {
        id: 'word_count',
        label: 'Content Length',
        status: wordCount >= 2500 ? 'pass' : (wordCount >= 1000 ? 'warn' : 'fail'),
        evidence: `${wordCount} words total.`,
        fix: 'Expand the content to at least 2,500 words for deep authority.'
      },
      {
        id: 'h1_check',
        label: 'Single H1 Tag',
        status: h1Count === 0 || h1Count === 1 ? 'pass' : 'fail',
        evidence: `${h1Count} H1 tags detected.`,
        fix: 'Ensure there is only one H1 tag (the title).'
      },
      {
        id: 'internal_links',
        label: 'Internal Linking',
        status: internalLinksFound.length >= 3 ? 'pass' : 'warn',
        evidence: `${internalLinksFound.length} internal links integrated.`,
        fix: 'Add more links to your other relevant site pages.'
      },
      {
        id: 'external_links',
        label: 'External Authority Links',
        status: externalLinksFound.length >= 2 ? 'pass' : 'warn',
        evidence: `${externalLinksFound.length} authority links found.`,
        fix: 'Link to 2-3 high-authority external sources to back your claims.'
      },
      {
        id: 'image_opt',
        label: 'Image Optimization',
        status: imagesWithKw.length >= 1 ? 'pass' : 'warn',
        evidence: `${imagesWithKw.length} images have keyword-rich alt text.`,
        fix: 'Ensure at least one image placeholder includes the focus keyword in its description.'
      }
    ];

    const score = Math.round((checks.filter(c => c.status === 'pass').length / checks.length) * 100);

    return {
      wordCount, kwFreq, density: density.toFixed(2),
      checks, score
    };
  })();

  const calculatedLiveScore = stats.score;

  return {
    provider, setProvider, openrouterModel, setOpenrouterModel, keysConfig,
    podcastScript, setPodcastScript, isGeneratingPodcast, isPlayingPodcast, currentPodcastLineIdx, setCurrentPodcastLineIdx,
    playbackSpeed, setPlaybackSpeed, podcastError, togglePlayPodcast, handleGeneratePodcast,
    focusKeyword, setFocusKeyword, blogTopic, setBlogTopic, targetAudience, setTargetAudience,
    internalLinksText, setInternalLinksText, referenceDocument, setReferenceDocument,
    toneSelection, setToneSelection, customDirectives, setCustomDirectives, smartExternalLinks, setSmartExternalLinks,
    isGenerating, loadingMessageIndex, errorText, isRefining, refinePrompt, setRefinePrompt,
    generatedOutput, editedBlogPost, setEditedBlogPost, activeTab, setActiveTab, previewMode, setPreviewMode,
    indexingUrl, setIndexingUrl, isCheckingIndex, indexingResults, indexingError, isDiagnosing, indexingDiagnosis,
    handleGenerateBlog, handleCoPilotRefine, handleResetInputs, handleIndexingCheck, handleIndexingDiagnosis,
    stats, calculatedLiveScore, parseBulkLinks
  };
}
