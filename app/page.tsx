"use client";

import { useState } from "react";
import axios from "axios";

type Mode = "api" | "scraper";

interface ScrapedResult {
  url: string;
  source: string;
  filename: string;
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("api");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState<ScrapedResult[]>([]);
  const [downloadedFiles, setDownloadedFiles] = useState<string[]>([]);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setResults([]);
    setDownloadedFiles([]);
    setStatus(mode === "api" ? "Extracting using SerpApi..." : "Scraping free sites...");

    try {
      if (mode === "api") {
        const { data } = await axios.post("/api/extract", { query });
        if (data.success) {
          setStatus(data.message);
          setDownloadedFiles(data.files || []);
        } else {
          setStatus("Error: " + (data.error || "Unknown error"));
        }
      } else {
        const { data } = await axios.post("/api/scrape", { keyword: query });
        if (data.success) {
          setStatus(data.message);
          setResults(data.results || []);
        } else {
          setStatus("Error: " + (data.error || "Unknown error"));
        }
      }
    } catch (error: any) {
      console.error("Action failed:", error);
      setStatus("Error: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    if (results.length === 0) return;

    setLoading(true);
    setStatus("Downloading all PDFs to local folder...");

    try {
      const { data } = await axios.post("/api/download", {
        urls: results.map((r) => r.url),
        query: query,
      });

      if (data.success) {
        setStatus(`Successfully downloaded ${data.files.length} files to pdfs/${query}`);
        setDownloadedFiles(data.files || []);
        setResults([]);
      } else {
        setStatus("Error: " + (data.error || "Download failed"));
      }
    } catch (error: any) {
      console.error("Download all failed:", error);
      setStatus("Error: " + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl space-y-10">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-black tracking-tighter bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            PDF EXTRACTOR
          </h1>
          <p className="text-neutral-500 text-lg font-medium">
            Search, Scrape, and Sync PDFs directly to your workspace.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex justify-center">
          <div className="bg-neutral-900 p-1.5 rounded-2xl flex gap-1 border border-neutral-800 shadow-xl">
            <button
              onClick={() => setMode("api")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === "api"
                  ? "bg-white text-black shadow-lg"
                  : "text-neutral-500 hover:text-neutral-300"
                }`}
            >
              SerpApi (Premium)
            </button>
            <button
              onClick={() => setMode("scraper")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === "scraper"
                  ? "bg-white text-black shadow-lg"
                  : "text-neutral-500 hover:text-neutral-300"
                }`}
            >
              Free Scraper (Crawl)
            </button>
          </div>
        </div>

        <form onSubmit={handleAction} className="relative group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === "api" ? "Query (e.g. NCERT Biology)" : "Keyword (e.g. Physics)"}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-3xl py-5 px-8 text-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-neutral-700 shadow-inner"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query}
            className="absolute right-3 top-3 bottom-3 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-neutral-800 disabled:to-neutral-900 disabled:text-neutral-500 font-bold text-sm tracking-wider uppercase transition-all shadow-xl active:scale-95"
          >
            {loading ? "Processing..." : mode === "api" ? "Extract Now" : "Find Links"}
          </button>
        </form>

        {status && (
          <div
            className={`p-5 rounded-2xl text-center font-bold tracking-tight border-2 animate-in fade-in zoom-in duration-300 ${status.startsWith("Error")
                ? "bg-red-500/5 text-red-500 border-red-500/20"
                : "bg-blue-500/5 text-blue-400 border-blue-500/20"
              }`}
          >
            {status}
          </div>
        )}

        {/* Scraper Results Links */}
        {results.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black tracking-tighter text-white">Links Found</h2>
              <button
                onClick={handleDownloadAll}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Download All PDFs
              </button>
            </div>
            <div className="bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 divide-y divide-neutral-800/50">
              {results.map((res, idx) => (
                <div key={idx} className="flex items-center gap-4 p-5 group hover:bg-neutral-800/30 transition-colors">
                  <div className="w-10 h-10 bg-neutral-800 rounded-xl flex items-center justify-center text-xs font-black text-neutral-500 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-all">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-300 font-bold truncate">{res.filename}</p>
                    <p className="text-neutral-600 text-xs truncate font-medium">{res.url}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Downloaded Files History */}
        {downloadedFiles.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black tracking-tighter text-white px-2">Recently Downloaded</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {downloadedFiles.map((file, idx) => (
                <div key={idx} className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl flex items-center gap-4 hover:border-blue-500/30 transition-all group">
                  <div className="p-2.5 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-all">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-neutral-200 truncate">{file.split('/').pop()}</p>
                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">{file.split('/')[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 rounded-full border border-neutral-800 text-xs font-bold text-neutral-600">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Storage: /pdfs/[query]
          </div>
        </div>
      </div>
    </div>
  );
}
