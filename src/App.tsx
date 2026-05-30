import { useState, useEffect, useCallback, useRef } from "react";
import { useAnalyze } from "./hooks/useAnalyze";
import {
  Sparkles, Plus, Trash2, Copy, Check, RefreshCw, Cpu, FileText, CheckCheck,
  CheckCircle2, XCircle, BookOpen, ExternalLink, Clock, AlertCircle,
  HelpCircle, Link as LinkIcon, ChevronDown, ChevronUp, ChevronLeft,
  ChevronRight, Edit2, Eye, FileCode, Sliders, Send, Play, Pause,
  Volume2, Podcast, Search, Settings, Layout, BarChart3, Info
} from "lucide-react";
import Markdown from "react-markdown";

export default function App() {
  const analyze = useAnalyze();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [copySuccessMap, setCopySuccessMap] = useState<Record<string, boolean>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const models = [
    { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet", provider: "Anthropic" },
    { id: "anthropic/claude-3-opus", label: "Claude 3 Opus", provider: "Anthropic" },
    { id: "anthropic/claude-3-haiku", label: "Claude 3 Haiku", provider: "Anthropic" },
    { id: "openai/gpt-4o", label: "GPT-4o", provider: "OpenAI" },
    { id: "openai/gpt-4o-mini", label: "GPT-4o mini", provider: "OpenAI" },
    { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash", provider: "Google" },
    { id: "google/gemini-pro-1.5", label: "Gemini Pro 1.5", provider: "Google" },
    { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", provider: "Meta" },
    { id: "meta-llama/llama-3.1-405b-instruct", label: "Llama 3.1 405B", provider: "Meta" },
    { id: "mistralai/mistral-large", label: "Mistral Large", provider: "Mistral" },
    { id: "perplexity/sonar", label: "Perplexity Sonar", provider: "Perplexity" },
    { id: "perplexity/sonar-reasoning", label: "Perplexity Reasoning", provider: "Perplexity" },
    { id: "deepseek/deepseek-chat", label: "DeepSeek V3", provider: "DeepSeek" },
    { id: "deepseek/deepseek-reasoner", label: "DeepSeek R1", provider: "DeepSeek" },
  ];

  const providers = Array.from(new Set(models.map(m => m.provider)));

  const selectedModel = models.find(m => m.id === analyze.openrouterModel) || models[0];

  const triggerCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccessMap((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => setCopySuccessMap((prev) => ({ ...prev, [key]: false })), 2000);
  };

  const loadingMessages = [
    "Analyzing your target audience...",
    "Scanning bulk internal link catalog...",
    "Establishing search title readability...",
    "Framing Markdown headers...",
    "Writing custom outbound resources...",
    "Generating descriptive media placeholders..."
  ];

  const renderInteractiveMarkdown = (textStr: string) => {
    if (!textStr) return null;
    const regex = /\[IMAGE\s+PLACEHOLDER:\s*([^\]]+)\]/gi;
    const components = [];
    let prevIndex = 0;
    let match;
    while ((match = regex.exec(textStr)) !== null) {
      if (match.index > prevIndex) components.push({ type: "text", content: textStr.substring(prevIndex, match.index) });
      components.push({ type: "placeholder", content: match[1] });
      prevIndex = regex.lastIndex;
    }
    if (prevIndex < textStr.length) components.push({ type: "text", content: textStr.substring(prevIndex) });

    return components.map((block, idx) => {
      if (block.type === "text") {
        return <div key={idx} className="markdown-body text-zinc-300"><Markdown>{block.content}</Markdown></div>;
      } else {
        return (
          <div key={idx} className="my-8 p-6 border-2 border-dashed border-zinc-800 bg-zinc-900/50 rounded-2xl flex flex-col items-center gap-3 text-center">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl"><Layout className="w-6 h-6" /></div>
            <div>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-1">Visual Asset Target</span>
              <p className="text-sm text-zinc-400 font-medium italic">"{block.content.trim()}"</p>
            </div>
          </div>
        );
      }
    });
  };

  const liveReadingTime = Math.ceil(analyze.stats.wordCount / 220);

  return (
    <div className="flex h-screen w-full bg-[#050505] text-zinc-200 font-sans overflow-hidden">
      {/* Sidebar - Redesigned */}
      <aside 
        style={{ width: sidebarOpen ? '320px' : '0', minWidth: sidebarOpen ? '320px' : '0' }}
        className="border-r border-zinc-900 bg-[#0a0a0a] flex flex-col transition-all duration-300 ease-in-out overflow-hidden z-20"
      >
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-lg shadow-white/10">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-bold text-white tracking-tight">Analyze</h1>
              <p className="text-[10px] text-zinc-500 font-medium">SEO Content Engine</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-zinc-800 rounded-md text-zinc-500 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-none">
          {/* Core Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
              <BarChart3 className="w-3.5 h-3.5" /> Core Blueprint
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400">Focus Keyword</label>
                <input
                  value={analyze.focusKeyword}
                  onChange={(e) => analyze.setFocusKeyword(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-white/20 transition-all outline-none"
                  placeholder="e.g. SaaS marketing"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400">Target Headline</label>
                <input
                  value={analyze.blogTopic}
                  onChange={(e) => analyze.setBlogTopic(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-white/20 transition-all outline-none"
                  placeholder="e.g. 10 Pro Strategies"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400">Audience Persona</label>
                <input
                  value={analyze.targetAudience}
                  onChange={(e) => analyze.setTargetAudience(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-white/20 transition-all outline-none"
                  placeholder="e.g. SaaS Founders"
                />
              </div>
            </div>
          </div>

          {/* Links Inventory */}
          <div className="space-y-4 pt-4 border-t border-zinc-900">
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2"><LinkIcon className="w-3.5 h-3.5" /> Inventory</div>
              <span className="text-[9px] bg-zinc-900 px-1.5 py-0.5 rounded">Bulk</span>
            </div>
            <textarea
              value={analyze.internalLinksText}
              onChange={(e) => analyze.setInternalLinksText(e.target.value)}
              className="w-full bg-zinc-900/30 border border-zinc-800 rounded-lg p-3 text-[11px] font-mono leading-relaxed h-32 focus:ring-1 focus:ring-white/20 transition-all outline-none resize-none"
              placeholder="URL | Keyword..."
            />
          </div>

          {/* Model Selection */}
          <div className="space-y-4 pt-4 border-t border-zinc-900">
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
              <Cpu className="w-3.5 h-3.5" /> Engine
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['gemini', 'openrouter'].map((p) => (
                <button
                  key={p}
                  onClick={() => analyze.setProvider(p as any)}
                  className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all ${analyze.provider === p ? 'bg-white text-black border-white shadow-lg shadow-white/5' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            {analyze.provider === 'openrouter' && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs flex items-center justify-between hover:border-zinc-700 transition-all outline-none group"
                >
                  <div className="flex flex-col items-start gap-0.5">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest leading-none">{selectedModel.provider}</span>
                    <span className="text-white font-medium">{selectedModel.label}</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-300 ${modelDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {modelDropdownOpen && (
                  <div className="absolute bottom-full left-0 w-full mb-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                    <div className="max-h-64 overflow-y-auto scrollbar-none py-2">
                      {providers.map((provider) => (
                        <div key={provider}>
                          <div className="px-3 py-1.5 text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] bg-zinc-950/50">
                            {provider}
                          </div>
                          {models.filter(m => m.provider === provider).map((model) => (
                            <button
                              key={model.id}
                              onClick={() => {
                                analyze.setOpenrouterModel(model.id);
                                setModelDropdownOpen(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-[11px] transition-colors flex items-center justify-between group ${analyze.openrouterModel === model.id ? 'bg-white/5 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
                            >
                              <span>{model.label}</span>
                              {analyze.openrouterModel === model.id && <Check className="w-3 h-3 text-emerald-500" />}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-[#0a0a0a] border-t border-zinc-900 space-y-3">
          {analyze.errorText && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-400 flex items-start gap-2 relative group animate-in slide-in-from-bottom-2 duration-300">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> 
              <span className="flex-1 pr-4">{analyze.errorText}</span>
              <button 
                onClick={() => analyze.setErrorText(null)}
                className="absolute top-2 right-2 p-1 hover:bg-red-500/20 rounded-md transition-colors"
              >
                <XCircle className="w-3 h-3 text-red-400/50 group-hover:text-red-400" />
              </button>
            </div>
          )}
          <button
            onClick={() => analyze.handleGenerateBlog()}
            disabled={analyze.isGenerating}
            className="w-full bg-white hover:bg-zinc-200 disabled:opacity-30 text-black font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xl shadow-white/5 uppercase tracking-widest"
          >
            {analyze.isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {analyze.generatedOutput ? "Regenerate Draft" : "Generate Masterpiece"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden">
        {/* Navigation Bar */}
        <header className="h-16 border-b border-zinc-900 bg-black/50 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-8">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-500 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <nav className="flex items-center gap-1">
              {[
                { id: "overview", label: "Specs", icon: Info },
                { id: "blog", label: "Editor", icon: Edit2 },
                { id: "score", label: "SEO Score", icon: BarChart3, badge: analyze.calculatedLiveScore },
                { id: "indexing", label: "Diagnostics", icon: Search },
                { id: "notebooklm", label: "NotebookLM", icon: BookOpen },
              ].map((tab) => (
                <button
                  key={tab.id}
                  disabled={!analyze.generatedOutput && !['notebooklm', 'indexing'].includes(tab.id)}
                  onClick={() => analyze.setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-20 ${analyze.activeTab === tab.id ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.badge !== undefined && analyze.generatedOutput && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] ${analyze.calculatedLiveScore >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {analyze.generatedOutput && (
              <button
                onClick={() => triggerCopy("md", analyze.editedBlogPost)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all"
              >
                {copySuccessMap["md"] ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Export</>}
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-12 scrollbar-thin">
          <div className="max-w-5xl mx-auto w-full">
            {/* Loading State */}
            {analyze.isGenerating && (
              <div className="flex flex-col items-center justify-center py-24 space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl border-2 border-zinc-900 border-t-white animate-spin" />
                  <Sparkles className="w-8 h-8 text-white absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-bold text-white tracking-tight uppercase tracking-widest">Crafting Your Strategy</h2>
                  <p className="text-zinc-500 text-sm font-medium">{loadingMessages[analyze.loadingMessageIndex]}</p>
                </div>
              </div>
            )}

            {!analyze.isGenerating && !analyze.generatedOutput && !['notebooklm', 'indexing'].includes(analyze.activeTab) && (
              <div className="py-20 text-center space-y-12">
                <div className="space-y-4">
                  <div className="inline-flex p-4 bg-zinc-900 rounded-2xl border border-zinc-800 mb-4">
                    <Layout className="w-8 h-8 text-zinc-400" />
                  </div>
                  <h1 className="text-4xl font-black text-white tracking-tight">Professional SEO Workstation</h1>
                  <p className="text-zinc-500 max-w-lg mx-auto leading-relaxed">
                    A premium content laboratory designed for high-performance marketing teams. Start by defining your strategy in the blueprint.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { title: "AI-Link Engine", desc: "Intelligent internal linking based on your inventory.", icon: LinkIcon, color: "text-blue-400" },
                    { title: "Live Scoring", desc: "Real-time Rank Math optimization checks.", icon: BarChart3, color: "text-emerald-400" },
                    { title: "Podcast Copilot", desc: "Turn briefs into conversational host dialogues.", icon: Podcast, color: "text-amber-400" }
                  ].map((feat) => (
                    <div key={feat.title} className="p-6 bg-zinc-900/50 border border-zinc-900 rounded-2xl text-left space-y-3 hover:border-zinc-800 transition-colors">
                      <feat.icon className={`w-5 h-5 ${feat.color}`} />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">{feat.title}</h4>
                      <p className="text-xs text-zinc-500 leading-relaxed">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab Contents */}
            {!analyze.isGenerating && (
              <div className="space-y-12 animate-in fade-in duration-700">
                
                {/* Overview Tab */}
                {analyze.activeTab === "overview" && analyze.generatedOutput && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <div className="p-8 bg-zinc-900/50 border border-zinc-900 rounded-3xl space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Metadata</span>
                          <button onClick={() => triggerCopy("title", analyze.generatedOutput?.seo_title || "")} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest">Copy Title</button>
                        </div>
                        <h2 className="text-2xl font-black text-white leading-tight tracking-tight">
                          {analyze.generatedOutput.seo_title}
                        </h2>
                        <div className="p-4 bg-black/40 rounded-xl border border-zinc-800">
                          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block mb-2">Meta Description</span>
                          <p className="text-xs text-zinc-400 leading-relaxed">{analyze.generatedOutput.meta_description}</p>
                        </div>
                      </div>

                      <div className="p-8 bg-zinc-900/50 border border-zinc-900 rounded-3xl space-y-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          <FileCode className="w-4 h-4" /> Structure
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {analyze.generatedOutput.table_of_contents.map((toc, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-zinc-900/50">
                              <span className="text-[10px] font-mono text-zinc-600">H2.{String(i+1).padStart(2,'0')}</span>
                              <span className="text-xs text-zinc-400 font-medium truncate">{toc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-3xl space-y-4">
                        <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Stats Overview</h4>
                        <div className="space-y-6">
                          <div>
                            <div className="flex justify-between text-xs mb-2">
                              <span className="text-zinc-500">Word Count</span>
                              <span className="text-white font-bold">{analyze.stats.wordCount}</span>
                            </div>
                            <div className="h-1.5 bg-blue-500/10 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${Math.min(analyze.stats.wordCount / 25, 100)}%` }} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Reading</span>
                              <span className="text-lg font-black text-white">{liveReadingTime}m</span>
                            </div>
                            <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Density</span>
                              <span className="text-lg font-black text-white">{analyze.stats.density}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Editor Tab */}
                {analyze.activeTab === "blog" && analyze.generatedOutput && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-6">
                      <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                        {[
                          { id: "split", icon: Sliders },
                          { id: "editor", icon: Edit2 },
                          { id: "preview", icon: Eye }
                        ].map((mode) => (
                          <button
                            key={mode.id}
                            onClick={() => analyze.setPreviewMode(mode.id as any)}
                            className={`p-2 rounded-lg transition-all ${analyze.previewMode === mode.id ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                            <mode.icon className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">Live Optimization</span>
                          <span className={`text-sm font-black ${analyze.calculatedLiveScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {analyze.calculatedLiveScore}/100
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-8 h-[65vh]">
                      {(analyze.previewMode === 'split' || analyze.previewMode === 'editor') && (
                        <div className="flex-1 bg-zinc-900/30 border border-zinc-900 rounded-3xl p-6 flex flex-col space-y-4">
                          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2">
                            <span>Markdown Editor</span>
                            <span>{analyze.stats.charCount} Chars</span>
                          </div>
                          <textarea
                            value={analyze.editedBlogPost}
                            onChange={(e) => analyze.setEditedBlogPost(e.target.value)}
                            className="flex-1 w-full bg-transparent text-sm font-mono leading-relaxed text-zinc-300 outline-none resize-none scrollbar-none"
                          />
                        </div>
                      )}
                      {(analyze.previewMode === 'split' || analyze.previewMode === 'preview') && (
                        <div className="flex-1 bg-white/[0.02] border border-zinc-900 rounded-3xl p-10 overflow-y-auto scrollbar-none">
                          <div className="max-w-2xl mx-auto space-y-12">
                            <div className="space-y-4 border-b border-zinc-900 pb-12">
                              <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
                                {analyze.generatedOutput.seo_title}
                              </h1>
                              <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                <span>{liveReadingTime} min read</span>
                                <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                <span className="text-blue-400">/blog/{analyze.generatedOutput.slug}</span>
                              </div>
                            </div>
                            <div className="space-y-6">
                              {renderInteractiveMarkdown(analyze.editedBlogPost)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <form 
                      onSubmit={analyze.handleCoPilotRefine}
                      className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center gap-4 shadow-2xl relative group"
                    >
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                      <Sparkles className="w-5 h-5 text-zinc-400 shrink-0 ml-2" />
                      <input
                        value={analyze.refinePrompt}
                        onChange={(e) => analyze.setRefinePrompt(e.target.value)}
                        placeholder="Refine this draft with AI... (e.g. 'Make it more professional')"
                        className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none placeholder-zinc-600"
                        disabled={analyze.isRefining}
                      />
                      <button
                        type="submit"
                        disabled={analyze.isRefining || !analyze.refinePrompt.trim()}
                        className="bg-white hover:bg-zinc-200 disabled:opacity-30 text-black font-bold px-6 py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all"
                      >
                        {analyze.isRefining ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Refine"}
                      </button>
                    </form>
                  </div>
                )}

                {/* Score Tab */}
                {analyze.activeTab === "score" && analyze.generatedOutput && (
                  <div className="max-w-4xl mx-auto space-y-12 pb-20">
                    {/* Header Score Card */}
                    <div className="p-12 bg-zinc-900/50 border border-zinc-900 rounded-[40px] flex flex-col md:flex-row items-center gap-12 text-center md:text-left relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 blur-[120px] rounded-full -mr-48 -mt-48" />
                      <div className="relative w-48 h-48 shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="96" cy="96" r="84" className="text-zinc-950" strokeWidth="12" stroke="currentColor" fill="transparent" />
                          <circle 
                            cx="96" cy="96" r="84" 
                            className={`${analyze.calculatedLiveScore >= 80 ? 'text-emerald-500' : analyze.calculatedLiveScore >= 50 ? 'text-amber-500' : 'text-red-500'} transition-all duration-1000`} 
                            strokeWidth="12" 
                            strokeDasharray={2*Math.PI*84} 
                            strokeDashoffset={(1 - analyze.calculatedLiveScore/100)*(2*Math.PI*84)} 
                            strokeLinecap="round" stroke="currentColor" fill="transparent" 
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-5xl font-black text-white tracking-tighter">{analyze.calculatedLiveScore}</span>
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Score</span>
                        </div>
                      </div>
                      <div className="space-y-4 relative">
                        <h3 className="text-2xl font-black text-white tracking-tight">Verified SEO Audit</h3>
                        <p className="text-zinc-500 text-sm leading-relaxed max-w-md">
                          Every rule below is actively verified against your draft. Points are only awarded for rules that meet strict evidence-based criteria.
                        </p>
                        <div className="flex gap-3">
                          <div className="px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-900 flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Passed</span>
                            <span className="text-lg font-black text-emerald-400">{analyze.stats.checks.filter(c => c.status === 'pass').length}</span>
                          </div>
                          <div className="px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-900 flex flex-col">
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Alerts</span>
                            <span className="text-lg font-black text-amber-400">{analyze.stats.checks.filter(c => c.status !== 'pass').length}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Checks Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analyze.stats.checks.map((check) => (
                        <div key={check.id} className="p-6 bg-zinc-900/30 border border-zinc-900 rounded-3xl space-y-4 group hover:border-zinc-800 transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {check.status === 'pass' ? (
                                <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500"><CheckCircle2 className="w-4 h-4" /></div>
                              ) : check.status === 'warn' ? (
                                <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500"><AlertCircle className="w-4 h-4" /></div>
                              ) : (
                                <div className="p-1.5 bg-red-500/10 rounded-lg text-red-500"><XCircle className="w-4 h-4" /></div>
                              )}
                              <span className="text-xs font-bold text-white uppercase tracking-wider">{check.label}</span>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                              check.status === 'pass' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                              check.status === 'warn' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                              'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                              {check.status}
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="p-3 bg-black/40 rounded-xl border border-zinc-900/50">
                              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">Evidence</span>
                              <p className="text-xs text-zinc-400 italic">"{check.evidence}"</p>
                            </div>
                            {check.status !== 'pass' && (
                              <div className="p-3 bg-white/[0.02] rounded-xl border border-dashed border-zinc-800">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">How to fix</span>
                                <p className="text-xs text-zinc-500">{check.fix}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Indexing Tab */}
                {analyze.activeTab === "indexing" && (
                  <div className="max-w-3xl mx-auto space-y-8">
                    <div className="space-y-4 text-center">
                      <div className="inline-flex p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                        <Search className="w-8 h-8 text-blue-400" />
                      </div>
                      <h2 className="text-3xl font-black text-white tracking-tight">Indexing Diagnostics</h2>
                      <p className="text-zinc-500 text-sm max-w-lg mx-auto leading-relaxed">
                        Identify technical blockers preventing your pages from appearing in Google search results.
                      </p>
                    </div>

                    <div className="flex gap-4 p-2 bg-zinc-900/50 border border-zinc-900 rounded-2xl">
                      <input
                        type="url"
                        value={analyze.indexingUrl}
                        onChange={(e) => analyze.setIndexingUrl(e.target.value)}
                        placeholder="https://example.com/page"
                        className="flex-1 bg-transparent border-none px-4 py-2 text-sm text-white focus:outline-none"
                      />
                      <button
                        onClick={analyze.handleIndexingCheck}
                        disabled={analyze.isCheckingIndex || !analyze.indexingUrl.trim()}
                        className="bg-white hover:bg-zinc-200 disabled:opacity-30 text-black font-bold px-8 py-2.5 rounded-xl text-[10px] uppercase tracking-widest transition-all"
                      >
                        {analyze.isCheckingIndex ? "Checking..." : "Analyze URL"}
                      </button>
                    </div>

                    {analyze.indexingResults && (
                      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className={`p-6 rounded-3xl border flex items-start gap-4 ${analyze.indexingResults.summaryStatus === 'critical' ? 'bg-red-500/5 border-red-500/10' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                          {analyze.indexingResults.summaryStatus === 'critical' ? <AlertCircle className="w-6 h-6 text-red-500 shrink-0" /> : <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />}
                          <div>
                            <h4 className={`text-sm font-bold uppercase tracking-widest mb-1 ${analyze.indexingResults.summaryStatus === 'critical' ? 'text-red-400' : 'text-emerald-400'}`}>
                              {analyze.indexingResults.summaryStatus === 'critical' ? 'Action Required' : 'Ready for Indexing'}
                            </h4>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                              {analyze.indexingResults.summaryStatus === 'critical' ? 'Critical technical issues were found that will prevent Google from indexing this page.' : 'No major technical barriers found. The page is well-optimized for crawlability.'}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          {analyze.indexingResults.checks.map((check: any) => (
                            <div key={check.id} className="p-5 bg-zinc-900/50 border border-zinc-900 rounded-2xl flex items-center justify-between group hover:border-zinc-800 transition-colors">
                              <div className="flex items-center gap-4">
                                {check.status === 'pass' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                <div className="space-y-0.5">
                                  <span className="text-xs font-bold text-white uppercase tracking-wider">{check.label}</span>
                                  <p className="text-[10px] text-zinc-500">{check.message}</p>
                                </div>
                              </div>
                              <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${check.status === 'pass' ? 'text-emerald-500' : 'text-red-500'}`}>{check.status}</span>
                            </div>
                          ))}
                        </div>

                        {!analyze.indexingDiagnosis && (
                          <button
                            onClick={analyze.handleIndexingDiagnosis}
                            disabled={analyze.isDiagnosing}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-2xl text-xs uppercase tracking-widest transition-all"
                          >
                            {analyze.isDiagnosing ? "Processing AI Diagnosis..." : "Get Detailed AI Diagnosis"}
                          </button>
                        )}

                        {analyze.indexingDiagnosis && (
                          <div className="p-8 bg-black border border-zinc-800 rounded-3xl space-y-8">
                            <div className="flex items-center gap-3">
                              <Sparkles className="w-5 h-5 text-white" />
                              <h4 className="text-sm font-bold text-white uppercase tracking-widest">AI Audit Report</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-3">
                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">Root Cause Analysis</span>
                                <p className="text-xs text-zinc-300 leading-relaxed font-medium">{analyze.indexingDiagnosis.rootCause}</p>
                              </div>
                              <div className="space-y-3">
                                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest block">Resolution Strategy</span>
                                <ul className="space-y-2">
                                  {analyze.indexingDiagnosis.fixSteps.map((step, i) => (
                                    <li key={i} className="text-xs text-zinc-400 flex gap-2">
                                      <span className="text-white font-bold">{i+1}.</span> {step}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* NotebookLM Tab */}
                {analyze.activeTab === "notebooklm" && (
                  <div className="max-w-3xl mx-auto space-y-12">
                    <div className="p-12 bg-zinc-900/50 border border-zinc-900 rounded-[40px] text-center space-y-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-blue-500/5 blur-[100px] rounded-full" />
                      <div className="relative space-y-6">
                        <div className="inline-flex p-4 bg-zinc-800 rounded-2xl border border-zinc-700">
                          <BookOpen className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="space-y-3">
                          <h2 className="text-3xl font-black text-white tracking-tight leading-tight">Research Copilot Integration</h2>
                          <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed font-medium">
                            Generate optimized system prompts for Google NotebookLM to synthesize deep research briefs from your source documents.
                          </p>
                        </div>
                        <button
                          onClick={() => triggerCopy("prompt", analyze.parseBulkLinks().map(l => l.url).join("\n"))}
                          className="bg-white hover:bg-zinc-200 text-black font-bold px-10 py-4 rounded-2xl text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-2xl shadow-white/10"
                        >
                          Copy Research Blueprint
                        </button>
                      </div>
                    </div>

                    <div className="p-12 bg-zinc-900/50 border border-zinc-900 rounded-[40px] space-y-8">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-left space-y-2">
                          <h3 className="text-xl font-black text-white flex items-center gap-3 justify-center md:justify-start">
                            <Podcast className="w-6 h-6 text-emerald-400" />
                            AI Audio Overview
                          </h3>
                          <p className="text-zinc-500 text-xs font-medium">Turn your strategy into a conversational host dialogue.</p>
                        </div>
                        {!analyze.podcastScript && (
                          <button
                            onClick={analyze.handleGeneratePodcast}
                            disabled={analyze.isGeneratingPodcast}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-8 py-3.5 rounded-2xl text-[10px] uppercase tracking-widest border border-zinc-700/50 transition-all disabled:opacity-30"
                          >
                            {analyze.isGeneratingPodcast ? "Synthesizing..." : "Generate Audio"}
                          </button>
                        )}
                      </div>

                      {analyze.podcastScript && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-black/50 p-8 rounded-[32px] border border-zinc-900 relative group">
                          <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-6">
                            <div className="relative">
                              <div className={`w-32 h-32 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-700 to-emerald-500 p-1 ${analyze.isPlayingPodcast ? 'animate-spin-slow' : ''}`}>
                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center border-4 border-black">
                                  <Podcast className="w-8 h-8 text-white" />
                                </div>
                              </div>
                              {analyze.isPlayingPodcast && (
                                <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full animate-ping" />
                              )}
                            </div>
                            <div className="flex items-center gap-4">
                              <button
                                onClick={analyze.togglePlayPodcast}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${analyze.isPlayingPodcast ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-white hover:bg-zinc-200 text-black'}`}
                              >
                                {analyze.isPlayingPodcast ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                              </button>
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Speed</span>
                                <div className="flex bg-zinc-900 p-1 rounded-lg">
                                  {[1, 1.25, 1.5].map(s => (
                                    <button
                                      key={s}
                                      onClick={() => analyze.setPlaybackSpeed(s)}
                                      className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${analyze.playbackSpeed === s ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                                    >
                                      {s}x
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="lg:col-span-8 h-80 overflow-y-auto scrollbar-none space-y-4 px-4">
                            {analyze.podcastScript.map((line, i) => (
                              <div key={i} className={`p-4 rounded-2xl border transition-all ${analyze.currentPodcastLineIdx === i ? 'bg-white/5 border-white/10 shadow-xl' : 'bg-transparent border-transparent opacity-40'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`w-2 h-2 rounded-full ${line.speaker === 'Sofia' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-white">{line.speaker}</span>
                                </div>
                                <p className="text-xs text-zinc-300 leading-relaxed font-medium">{line.line}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
      `}</style>
    </div>
  );
}
