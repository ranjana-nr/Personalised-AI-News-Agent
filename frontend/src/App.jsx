import { useState, useEffect, useCallback } from "react"

// -------------------------------------------------------------
// ARTICLE DETAIL MODAL
// -------------------------------------------------------------
function ArticleDetailModal({ article, allArticles, onClose }) {
  const [detailSummary, setDetailSummary] = useState(null)
  const [isDetailLoading, setIsDetailLoading] = useState(true)
  const [relatedArticles, setRelatedArticles] = useState([])

  // Fetch detailed summary + same-story related articles from backend
  useEffect(() => {
    let cancelled = false
    setIsDetailLoading(true)
    setDetailSummary(null)
    setRelatedArticles([])

    const fetchDetail = async () => {
      try {
        const res = await fetch("http://localhost:8000/article-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: article.title,
            description: article.summary,
            category: article.category,
            url: article.url,
          }),
        })
        if (!res.ok) throw new Error("Failed")
        const data = await res.json()
        if (!cancelled) {
          setDetailSummary(data.detailed_summary)
          if (data.related_articles && data.related_articles.length > 0) {
            setRelatedArticles(data.related_articles)
          } else {
            const fallback = (allArticles || [])
              .filter((a) => a.category === article.category && a.url !== article.url)
              .slice(0, 4)
            setRelatedArticles(fallback)
          }
        }
      } catch {
        if (!cancelled) {
          setDetailSummary(article.ai_summary || article.summary)
          const fallback = (allArticles || [])
            .filter((a) => a.category === article.category && a.url !== article.url)
            .slice(0, 4)
          setRelatedArticles(fallback)
        }
      } finally {
        if (!cancelled) setIsDetailLoading(false)
      }
    }

    fetchDetail()
    return () => { cancelled = true }
  }, [article, allArticles])

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  const formatDate = (isoString) => {
    if (!isoString) return ""
    const d = new Date(isoString)
    return isNaN(d.getTime())
      ? ""
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        backgroundColor: "rgba(3, 7, 18, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        animation: "backdropFadeIn 0.2s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "760px",
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "#0f172a",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          borderRadius: "24px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(59, 130, 246, 0.15)",
          animation: "slideUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header Hero Image (if available) */}
        {article.image && (
          <div style={{ position: "relative", height: "240px", width: "100%", overflow: "hidden", borderRadius: "24px 24px 0 0" }}>
            <img
              src={article.image}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { e.target.parentElement.style.display = "none" }}
            />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, #0f172a 0%, rgba(15,23,42,0.4) 60%, transparent 100%)"
            }} />
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "18px",
            zIndex: 10,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#fff"
            e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.4)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#94a3b8"
            e.currentTarget.style.backgroundColor = "rgba(15, 23, 42, 0.85)"
          }}
        >
          {'\u2715'}
        </button>

        {/* Modal Content */}
        <div style={{ padding: "28px 32px 36px" }}>
          {/* Metadata Row */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
            <span style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              backgroundColor: "rgba(59, 130, 246, 0.15)",
              color: "#60a5fa",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            }}>
              {article.category}
            </span>
            <span style={{ color: "#64748b", fontSize: "13px" }}>{'\u2022'}</span>
            <span style={{ color: "#94a3b8", fontSize: "13px", fontWeight: 600 }}>
              {article.source}
            </span>
            {article.publishedAt && (
              <>
                <span style={{ color: "#64748b", fontSize: "13px" }}>{'\u2022'}</span>
                <span style={{ color: "#64748b", fontSize: "13px" }}>
                  {formatDate(article.publishedAt)}
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: "clamp(1.25rem, 3vw, 1.6rem)",
            fontWeight: 800,
            color: "#f1f5f9",
            lineHeight: 1.35,
            marginBottom: "24px",
            letterSpacing: "-0.02em",
          }}>
            {article.title}
          </h2>

          {/* AI Summary Section */}
          <div style={{
            background: "rgba(59, 130, 246, 0.06)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: "16px",
            padding: "20px 24px",
            marginBottom: "28px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontSize: "16px", color: "#60a5fa" }}>{'\u2726'}</span>
              <span style={{
                fontSize: "13px", fontWeight: 700,
                color: "#60a5fa",
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>
                AI Briefing
              </span>
            </div>

            {isDetailLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[100, 90, 75].map((w, i) => (
                  <div key={i} style={{
                    height: "14px", borderRadius: "7px",
                    background: "rgba(59, 130, 246, 0.15)",
                    width: `${w}%`,
                    animation: "shimmer 1.5s ease infinite",
                  }} />
                ))}
              </div>
            ) : (
              <p style={{ color: "#cbd5e1", fontSize: "15px", lineHeight: 1.75, margin: 0 }}>
                {detailSummary}
              </p>
            )}
          </div>

          {/* Read Full Article CTA */}
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "12px 24px",
              background: "linear-gradient(135deg, #2563eb, #4f46e5)",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "14px", fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 24px rgba(59,130,246,0.3)",
              transition: "transform 0.15s, box-shadow 0.15s",
              marginBottom: relatedArticles.length > 0 ? "32px" : "0",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "0 6px 32px rgba(59,130,246,0.45)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "0 4px 24px rgba(59,130,246,0.3)"
            }}
          >
            Read Full Article
            <span style={{ fontSize: "15px" }}>{'\u2197'}</span>
          </a>

          {/* Other Coverage on this Story */}
          {relatedArticles.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <span style={{ fontSize: "15px", color: "#38bdf8" }}>{'\u25C8'}</span>
                <h3 style={{
                  fontSize: "14px", fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  margin: 0,
                }}>
                  Other Coverage on this Story
                </h3>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "12px",
              }}>
                {relatedArticles.map((sim, idx) => (
                  <SimilarCard key={idx} article={sim} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// SIMILAR ARTICLE MINI CARD
// -------------------------------------------------------------
function SimilarCard({ article }) {
  const [hovered, setHovered] = useState(false)
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        background: hovered ? "rgba(30,41,59,0.9)" : "rgba(15,23,42,0.6)",
        border: `1px solid ${hovered ? "rgba(59,130,246,0.4)" : "rgba(30,41,59,0.8)"}`,
        borderRadius: "12px",
        padding: "14px",
        textDecoration: "none",
        transition: "all 0.2s",
        cursor: "pointer",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 4px 20px rgba(59,130,246,0.12)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {article.image && (
        <div style={{ height: "80px", borderRadius: "8px", overflow: "hidden", marginBottom: "10px" }}>
          <img
            src={article.image}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { e.target.parentElement.style.display = "none" }}
          />
        </div>
      )}
      <p style={{
        color: hovered ? "#e2e8f0" : "#cbd5e1",
        fontSize: "12px", fontWeight: 600,
        lineHeight: 1.5,
        margin: 0,
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        transition: "color 0.2s",
      }}>
        {article.title}
      </p>
      <p style={{ color: "#475569", fontSize: "11px", marginTop: "6px", marginBottom: 0 }}>
        {article.source}
      </p>
    </a>
  )
}

// -------------------------------------------------------------
// NEWS CARD (Clickable)
// -------------------------------------------------------------
function NewsCard({ article, formatDate, onClick }) {
  return (
    <article
      onClick={onClick}
      className="rounded-2xl bg-slate-900/90 border border-slate-800/80 overflow-hidden hover:border-blue-500/50 transition-all duration-300 flex flex-col justify-between group shadow-lg cursor-pointer"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)"
        e.currentTarget.style.boxShadow = "0 12px 30px rgba(59,130,246,0.15)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)"
        e.currentTarget.style.boxShadow = "none"
      }}
    >
      <div>
        {article.image ? (
          <div className="h-48 w-full overflow-hidden relative">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { e.target.style.display = "none" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60" />
            <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/90 backdrop-blur-md text-white shadow">
              {article.category}
            </span>
            <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-950/80 backdrop-blur-md text-blue-300 border border-blue-500/30">
              {'\u2726'} View AI Summary
            </span>
          </div>
        ) : (
          <div className="p-6 pb-0 flex justify-between items-center">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {article.category}
            </span>
            <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
              {'\u2726'} AI Summary
            </span>
          </div>
        )}

        <div className="p-6">
          <h2 className="text-xl font-bold mb-3 text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
            {article.title}
          </h2>
          <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed mb-4">
            {article.summary}
          </p>
        </div>
      </div>

      <div className="px-6 pb-6 pt-0 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/40 mt-auto">
        <div className="flex items-center gap-2 pt-4">
          <span className="font-semibold text-slate-400">{article.source}</span>
          {article.publishedAt && (
            <>
              <span className="text-slate-600 text-xs">{'\u2022'}</span>
              <span>{formatDate(article.publishedAt)}</span>
            </>
          )}
        </div>
        <span className="text-blue-400 text-xs font-semibold pt-4 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          Details {'\u2192'}
        </span>
      </div>
    </article>
  )
}

// -------------------------------------------------------------
// MAIN APP COMPONENT
// -------------------------------------------------------------
const CATEGORIES = [
  { name: "Artificial Intelligence", icon: "\u{1F916}" },
  { name: "Technology", icon: "\u{1F4BB}" },
  { name: "Space", icon: "\u{1F680}" },
  { name: "Science", icon: "\u{1F52C}" },
  { name: "Gaming", icon: "\u{1F3AE}" },
  { name: "Finance", icon: "\u{1F4C8}" },
]

function App() {
  const [page, setPage] = useState("home")
  const [interests] = useState(CATEGORIES)
  const [selectedInterests, setSelectedInterests] = useState([])
  const [articles, setArticles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedArticle, setSelectedArticle] = useState(null)

  const toggleInterest = (categoryName) => {
    setSelectedInterests((prev) =>
      prev.includes(categoryName)
        ? prev.filter((item) => item !== categoryName)
        : [...prev, categoryName]
    )
  }

  const generateNews = async (customInterests = []) => {
    const topicsToFetch = customInterests.length > 0 ? customInterests : selectedInterests
    if (topicsToFetch.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("http://localhost:8000/generate-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: topicsToFetch }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(
          errData.detail
            ? (Array.isArray(errData.detail) ? errData.detail[0]?.msg : errData.detail)
            : `Server responded with status ${response.status}`
        )
      }

      const data = await response.json()
      setArticles(data.articles || [])
      setPage("dashboard")
    } catch (err) {
      setError(err.message || "Failed to generate your personalized news.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseModal = useCallback(() => {
    setSelectedArticle(null)
  }, [])

  const formatDate = (isoString) => {
    if (!isoString) return ""
    const d = new Date(isoString)
    return isNaN(d.getTime())
      ? ""
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  // -----------------------------------------------------------
  // PAGE 1: HOME (LANDING)
  // -----------------------------------------------------------
  if (page === "home") {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans selection:bg-blue-500 selection:text-white">
        <nav className="px-8 py-6 max-w-7xl mx-auto w-full flex items-center justify-between border-b border-slate-800/60">
          <div className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="text-blue-500 text-3xl">{'\u2726'}</span>
            MyNews-<span className="text-blue-400">AI</span>
          </div>
          <button
            onClick={() => setPage("interests")}
            className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
          >
            Get Started {'\u2192'}
          </button>
        </nav>

        <main className="max-w-4xl mx-auto px-6 py-20 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-8">
            <span>{'\u2728'}</span> AI-Powered Personalized News Intelligence
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight md:leading-none mb-8">
            Your news. <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Tailored to your interests.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
            Stop drowning in clickbait and endless noise. Our AI curator aggregates,
            organizes, and explains the latest stories across your favorite topics in real-time.
          </p>

          <button
            onClick={() => setPage("interests")}
            className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg transition shadow-xl shadow-blue-600/30 flex items-center gap-3 cursor-pointer group"
          >
            Configure Your Briefing
            <span className="group-hover:translate-x-1 transition-transform">{'\u2192'}</span>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left w-full">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur">
              <div className="text-3xl mb-4">{'\u26A1'}</div>
              <h2 className="text-lg font-bold mb-2">Smart Aggregation</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Filters thousands of global sources using real-time search to deliver high-quality stories.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur">
              <div className="text-3xl mb-4">{'\u{1F3AF}'}</div>
              <h2 className="text-lg font-bold mb-2">100% Personalized</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Select your interest topics and receive articles specifically curated for your preferences.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur">
              <div className="text-3xl mb-4">{'\u{1F4F0}'}</div>
              <h2 className="text-lg font-bold mb-2">Live Briefings</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Get up-to-the-minute updates with direct links to verified full coverage articles.
              </p>
            </div>
          </div>
        </main>

        <footer className="text-center py-8 text-slate-600 text-sm border-t border-slate-900">
          Powered by live NewsAPI & LLM Intelligence
        </footer>
      </div>
    )
  }

  // -----------------------------------------------------------
  // PAGE 2: TOPIC SELECTION
  // -----------------------------------------------------------
  if (page === "interests") {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500 selection:text-white">
        <nav className="px-8 py-6 max-w-7xl mx-auto flex items-center justify-between border-b border-slate-800/60">
          <div onClick={() => setPage("home")} className="text-2xl font-bold cursor-pointer flex items-center gap-2">
            <span className="text-blue-500 text-3xl">{'\u2726'}</span>
            MyNews-<span className="text-blue-400">AI</span>
          </div>
          <button
            onClick={() => setPage("home")}
            className="text-slate-400 hover:text-white text-sm font-medium transition cursor-pointer flex items-center gap-1"
          >
            {'\u2190'} Back to Home
          </button>
        </nav>

        <main className="max-w-3xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">What are you interested in?</h1>
            <p className="text-slate-400 mt-4 text-lg">Choose the topics you want your AI agent to fetch and summarize.</p>
          </div>

          {error && (
            <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-start gap-3">
              <span className="text-xl">{'\u26A0\uFE0F'}</span>
              <div>
                <strong className="font-semibold block mb-1">Error Fetching News</strong>
                {error}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {interests.map((interest) => {
              const isSelected = selectedInterests.includes(interest.name)
              return (
                <button
                  key={interest.name}
                  onClick={() => toggleInterest(interest.name)}
                  className={`p-6 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                      : "border-slate-800 bg-slate-900 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{interest.icon}</span>
                      <span className="font-semibold text-lg">{interest.name}</span>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs transition ${
                        isSelected
                          ? "border-blue-400 bg-blue-500 text-white font-bold"
                          : "border-slate-700"
                      }`}
                    >
                      {isSelected ? '\u2713' : ""}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-10 text-center">
            <p className="text-slate-400 text-sm mb-4">
              <span className="text-blue-400 font-semibold">{selectedInterests.length}</span> topics selected
            </p>
            <button
              disabled={selectedInterests.length === 0 || isLoading}
              onClick={() => generateNews()}
              className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 font-semibold text-lg transition shadow-lg shadow-blue-500/20 flex items-center gap-3 mx-auto cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Your News...
                </>
              ) : (
                `Generate My News \u2728`
              )}
            </button>
          </div>
        </main>
      </div>
    )
  }

  // -----------------------------------------------------------
  // PAGE 3: DASHBOARD
  // -----------------------------------------------------------
  if (page === "dashboard") {
    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans">
        {selectedArticle && (
          <ArticleDetailModal
            article={selectedArticle}
            allArticles={articles}
            onClose={handleCloseModal}
          />
        )}

        <nav className="px-8 py-6 max-w-7xl mx-auto flex items-center justify-between border-b border-slate-800/60">
          <div onClick={() => setPage("home")} className="text-2xl font-bold cursor-pointer flex items-center gap-2">
            <span className="text-blue-500 text-3xl">{'\u2726'}</span>
            MyNews-<span className="text-blue-400">AI</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage("interests")}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 text-sm font-medium transition cursor-pointer flex items-center gap-2"
            >
              <span>{'\u2699\uFE0F'}</span> Change Topics
            </button>
            <button
              onClick={() => generateNews()}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? "Refreshing..." : `\u{1F504} Refresh News`}
            </button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-8 py-12">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/40 pb-8">
            <div>
              <p className="text-blue-400 text-sm font-semibold tracking-wider uppercase">YOUR PERSONALIZED BRIEFING</p>
              <h1 className="text-4xl font-extrabold mt-2 tracking-tight">Latest News Headlines {'\u{1F4F0}'}</h1>
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedInterests.map((interest) => (
                  <span key={interest} className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-slate-500 text-sm">Showing {articles.length} curated articles</p>
          </div>

          {error && (
            <div className="mb-8 p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{'\u26A0\uFE0F'}</span>
                <div>
                  <strong className="font-semibold block mb-1">Failed to update briefing</strong>
                  <span className="text-sm opacity-90">{error}</span>
                </div>
              </div>
              <button
                onClick={() => generateNews()}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition shrink-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse flex flex-col justify-between h-80">
                  <div>
                    <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
                    <div className="h-40 bg-slate-800/80 rounded-xl mb-4"></div>
                    <div className="h-6 bg-slate-800 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-slate-800/60 rounded w-full mb-2"></div>
                  </div>
                  <div className="h-4 bg-slate-800 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-lg mx-auto my-12">
              <div className="text-5xl mb-4">{'\u{1F50D}'}</div>
              <h2 className="text-2xl font-bold">No articles found</h2>
              <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                We couldn't retrieve stories for your selected topics right now. Try selecting different topics or click refresh.
              </p>
              <button
                onClick={() => setPage("interests")}
                className="mt-6 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition cursor-pointer"
              >
                Edit Interest Topics
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, index) => (
                <NewsCard
                  key={index}
                  article={article}
                  formatDate={formatDate}
                  onClick={() => setSelectedArticle(article)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    )
  }

  return null
}

export default App
