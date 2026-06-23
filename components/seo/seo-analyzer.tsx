"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Search, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Loader2,
  Copy,
  XCircle,
  BarChart3,
  Lightbulb
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import readingTime from "reading-time"
// @ts-ignore
import keyword_extractor from "keyword-extractor"
// @ts-ignore
import readability from "text-readability"

interface SEOAnalyzerProps {
  title: string
  content: string
  excerpt?: string
  tags: string[]
  type: "story" | "poem" | "blog"
  genre?: string
  onApplyTitle?: (title: string) => void
  onApplyTags?: (tags: string[]) => void
}

interface SEOCheck {
  label: string
  passed: boolean
  message: string
}

interface AnalysisResult {
  score: number
  analysis: string
  suggestedTitles: string[]
  suggestedHashtags: string[]
  improvements: string[]
  checks: SEOCheck[]
}

function calculateLiveSEO(title: string, content: string, excerpt?: string, tags: string[] = []) {
  const checks: SEOCheck[] = []
  
  // 1. Get plain text and elements using browser DOMParser
  let plainText = ""
  let imgCount = 0
  let missingAltCount = 0
  let hasLinks = false
  let h1Count = 0
  let h2Count = 0
  let h3Count = 0

  if (typeof window !== "undefined" && content) {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(content, "text/html")
      plainText = doc.body.textContent || ""
      
      const images = doc.querySelectorAll("img")
      imgCount = images.length
      images.forEach(img => {
        const alt = img.getAttribute("alt")
        if (!alt || !alt.trim()) {
          missingAltCount++
        }
      })

      const links = doc.querySelectorAll("a")
      hasLinks = links.length > 0

      h1Count = doc.querySelectorAll("h1").length
      h2Count = doc.querySelectorAll("h2").length
      h3Count = doc.querySelectorAll("h3").length
    } catch (e) {
      plainText = content.replace(/<[^>]+>/g, '').trim()
    }
  } else {
    plainText = content ? content.replace(/<[^>]+>/g, '').trim() : ""
  }

  // 2. Reading Time and Word Count
  let rTimeText = "0 min read"
  let wordCount = 0
  try {
    const stats = readingTime(plainText)
    rTimeText = stats.text
    wordCount = stats.words
  } catch (e) {
    const words = plainText.split(/\s+/).filter(w => w.length > 0)
    wordCount = words.length
    rTimeText = `${Math.ceil(wordCount / 200)} min read`
  }

  // Rule: Content Length
  if (wordCount === 0) {
    checks.push({
      label: "Content Length",
      passed: false,
      message: "Please write some content to begin checking SEO."
    })
  } else if (wordCount < 300) {
    checks.push({
      label: "Content Length",
      passed: false,
      message: `Content is too short (${wordCount} words). Aim for 300+ words to rank.`
    })
  } else {
    checks.push({
      label: "Content Length",
      passed: true,
      message: `Content word count is great (${wordCount} words, ~${rTimeText}).`
    })
  }

  // 3. Readability Score using text-readability
  let fleschScore = 100
  let fleschGrade = "Easy"
  if (plainText && plainText.length > 20) {
    try {
      fleschScore = readability.fleschReadingEase(plainText)
      if (fleschScore > 90) fleschGrade = "Very Easy (5th Grade)"
      else if (fleschScore > 80) fleschGrade = "Easy (6th Grade)"
      else if (fleschScore > 70) fleschGrade = "Fairly Easy (7th Grade)"
      else if (fleschScore > 60) fleschGrade = "Standard English (8-9th Grade)"
      else if (fleschScore > 50) fleschGrade = "Fairly Difficult (10-12th Grade)"
      else if (fleschScore > 30) fleschGrade = "Difficult (College)"
      else fleschGrade = "Very Difficult (Graduate)"
    } catch (e) {
      // Ignore
    }
  }
  checks.push({
    label: "Readability (Flesch Ease)",
    passed: fleschScore >= 60,
    message: `Readability score is ${fleschScore.toFixed(0)} (${fleschGrade}). Aim for 60+.`
  })

  // 4. Title Length Check
  const titleLen = title ? title.length : 0
  if (titleLen === 0) {
    checks.push({
      label: "Title Length",
      passed: false,
      message: "Please write a title."
    })
  } else if (titleLen < 40) {
    checks.push({
      label: "Title Length",
      passed: false,
      message: `Title is too short (${titleLen} chars). Target is 40-60 characters.`
    })
  } else if (titleLen > 60) {
    checks.push({
      label: "Title Length",
      passed: false,
      message: `Title is too long (${titleLen} chars). Target is 40-60 characters.`
    })
  } else {
    checks.push({
      label: "Title Length",
      passed: true,
      message: `Ideal title length (${titleLen} characters).`
    })
  }

  // 5. Keyword Density for Tags using keyword-extractor
  if (tags && tags.length > 0) {
    tags.forEach(tag => {
      const t = tag.toLowerCase().trim()
      if (!t) return
      const regex = new RegExp(`\\b${t}\\b`, 'gi')
      const matches = plainText.match(regex) || []
      const count = matches.length
      const density = wordCount > 0 ? (count / wordCount) * 100 : 0
      
      let passed = true
      let msg = `Keyword "${tag}" density is ${density.toFixed(2)}% (${count} times).`
      if (count === 0) {
        passed = false
        msg = `Keyword "${tag}" is missing from content.`
      } else if (density > 2.5) {
        passed = false
        msg = `Keyword "${tag}" density is too high (${density.toFixed(2)}%). Avoid stuffing.`
      } else if (density < 0.5) {
        passed = false
        msg = `Keyword "${tag}" density is very low (${density.toFixed(2)}%). Use it more.`
      }
      checks.push({
        label: `Keyword "${tag}" Density`,
        passed,
        message: msg
      })
    })
  } else {
    checks.push({
      label: "SEO Keywords / Tags",
      passed: false,
      message: "No keywords/tags defined. Add tags to check density."
    })
  }

  // 6. Heading Structure
  if (h1Count > 1) {
    checks.push({
      label: "Heading Structure",
      passed: false,
      message: `Multiple H1 headings detected (${h1Count}). Use only one H1 for page title.`
    })
  } else {
    const hasStructure = h2Count > 0 || h3Count > 0
    checks.push({
      label: "Heading Structure",
      passed: hasStructure,
      message: hasStructure 
        ? `Good structure with ${h2Count} H2 headings and ${h3Count} H3 headings.` 
        : "No H2/H3 subheadings found. Add subheadings to organize key sections."
    })
  }

  // 7. Alt Attributes for Images
  if (imgCount > 0) {
    checks.push({
      label: "Image Alt Tags",
      passed: missingAltCount === 0,
      message: missingAltCount > 0 
        ? `${missingAltCount} out of ${imgCount} images are missing alternative text attributes.`
        : `All ${imgCount} images have alt tags.`
    })
  } else {
    checks.push({
      label: "Images & Rich Media",
      passed: false,
      message: "No images found. Add relevant images to enrich your content."
    })
  }

  // 8. Internal/External Links
  checks.push({
    label: "Links presence",
    passed: hasLinks,
    message: hasLinks 
      ? "Content includes outbound/inbound links."
      : "No links found. Add links to build authority."
  })

  // Final score calculation
  const total = checks.length
  const passedCount = checks.filter(c => c.passed).length
  const score = total > 0 ? Math.round((passedCount / total) * 100) : 0

  return { score, checks }
}

export function SEOAnalyzer({ 
  title, 
  content, 
  excerpt, 
  tags = [], 
  type, 
  genre,
  onApplyTitle,
  onApplyTags 
}: SEOAnalyzerProps) {
  const { toast } = useToast()
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const liveSEO = useMemo(() => {
    return calculateLiveSEO(title, content, excerpt, tags)
  }, [title, content, excerpt, tags])

  const activeScore = result ? result.score : liveSEO.score
  const activeChecks = result ? result.checks : liveSEO.checks

  const handleAnalyze = async () => {
    if (!title && !content) {
      toast({
        title: "Incomplete content",
        description: "Please provide a title or content to analyze SEO.",
        variant: "destructive",
      })
      return
    }

    setAnalyzing(true)
    try {
      const res = await fetch("/api/seo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, excerpt, tags, type, genre }),
      })

      if (!res.ok) throw new Error("Failed to analyze SEO")
      const data = await res.json()
      setResult(data)
      setShowModal(true)
      
      toast({
        title: "SEO Analysis Complete",
        description: `Your content scored ${data.score}/100.`,
      })
    } catch (err: any) {
      toast({
        title: "Analysis Failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard.`,
    })
  }

  const getScoreColor = (score: number) => {
    if (score > 75) return "text-green-500"
    if (score > 50) return "text-amber-500"
    return "text-red-500"
  }

  const getScoreBg = (score: number) => {
    if (score > 75) return "bg-green-500/10"
    if (score > 50) return "bg-amber-500/10"
    return "bg-red-500/10"
  }

  return (
    <div className="mt-6">
      <Card className="border border-border/10 bg-card rounded-2xl shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/5 border-b border-border/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-3 w-3 rounded-full animate-pulse transition-all duration-300",
                activeScore > 75 ? "bg-green-500" : activeScore > 50 ? "bg-amber-500" : "bg-red-500"
              )} />
              <CardTitle className="text-lg font-serif">SEO Compatibility</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="rounded-lg h-8 px-3 text-xs"
              >
                {isExpanded ? "Hide Details" : "View Live Checks"}
              </Button>
              {result && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowModal(true)}
                  className="rounded-lg h-8 px-3 text-xs"
                >
                  View Details
                </Button>
              )}
              <Button 
                size="sm" 
                onClick={handleAnalyze} 
                disabled={analyzing}
                className="rounded-lg h-8 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3 mr-1.5" />
                    Trigger SEO Check
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          {analyzing && (
            <div className="py-4 space-y-2">
              <Progress value={undefined} className="h-1 animate-pulse" />
              <p className="text-[10px] text-center text-muted-foreground">
                Analyzing title, hashtags, and keywords compatibility...
              </p>
            </div>
          )}

          {!analyzing && (
            <div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-2xl font-bold font-serif", getScoreColor(activeScore))}>
                      {activeScore}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">Rank Score (Live)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 italic">
                    {result ? `"${result.analysis}"` : "Live compatibility score. Trigger analysis for AI recommendations."}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {activeChecks.slice(0, 4).map((check, i) => (
                    <div 
                      key={i} 
                      title={`${check.label}: ${check.message}`}
                      className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center border transition-all duration-300",
                        check.passed ? "bg-green-50 border-green-200 text-green-600 dark:bg-green-950/20 dark:border-green-900/30" : "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-900/30"
                      )}
                    >
                      {check.passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    </div>
                  ))}
                </div>
              </div>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-border/10 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Live Content Audit ({activeChecks.filter(c => c.passed).length}/{activeChecks.length} Passed)
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {activeChecks.map((check, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs py-1">
                        <div className="mt-0.5 shrink-0">
                          {check.passed ? (
                            <div className="h-3.5 w-3.5 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                            </div>
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
                              <XCircle className="h-2.5 w-2.5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-[11px] leading-none">{check.label}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{check.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Analysis Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto border-none shadow-2xl rounded-3xl p-0">
          <div className={cn("p-8 sticky top-0 z-10 border-b", result ? getScoreBg(result.score) : "bg-muted")}>
            <DialogHeader className="space-y-1">
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="bg-background/50 border-border/20 uppercase tracking-tighter text-[10px]">
                  Whispr SEO Intel
                </Badge>
                {result && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Overall Visibility:</span>
                    <span className={cn("text-2xl font-black font-serif", getScoreColor(result.score))}>
                      {result.score}%
                    </span>
                  </div>
                )}
              </div>
              <DialogTitle className="text-3xl font-serif font-bold">Search Optimization Report</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                AI-powered analysis of your {type} based on recent trending search patterns and SEO best practices.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-8">
            {result && (
              <>
                {/* Checklist Section */}
                <section className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Compatibility Checklist
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {result.checks.map((check, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-muted/20 border border-border/5 rounded-xl">
                        {check.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                        )}
                        <div>
                          <p className="text-xs font-bold">{check.label}</p>
                          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{check.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Suggestions Section */}
                <section className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    AI Suggested Improvements
                  </h4>
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground">High-Ranking Title Options:</p>
                    <div className="grid gap-2">
                      {result.suggestedTitles.map((t, i) => (
                        <div key={i} className="group flex items-center justify-between p-3 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20 rounded-xl hover:border-indigo-300 transition-all">
                          <span className="text-sm font-medium pr-4">{t}</span>
                          <div className="flex gap-1.5">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 px-2 text-[10px]" 
                              onClick={() => copyToClipboard(t, "Title")}
                            >
                              <Copy className="h-3.5 w-3.5 mr-1" /> Copy
                            </Button>
                            {onApplyTitle && (
                              <Button 
                                size="sm" 
                                className="h-8 px-3 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white" 
                                onClick={() => {
                                  onApplyTitle(t)
                                  setShowModal(false)
                                }}
                              >
                                Use This
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Keywords Section */}
                <section className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Trending Hashtags & Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.suggestedHashtags.map((h, i) => (
                      <Badge 
                        key={i} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-primary/10 py-1.5 px-3 rounded-lg text-xs"
                        onClick={() => copyToClipboard(h, "Hashtag")}
                      >
                        #{h.replace(/^#/, "")}
                      </Badge>
                    ))}
                  </div>
                  {onApplyTags && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs w-full rounded-xl border-dashed"
                      onClick={() => {
                        onApplyTags(result.suggestedHashtags)
                        setShowModal(false)
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-2 text-amber-500" />
                      Apply All Suggested Tags
                    </Button>
                  )}
                </section>

                {/* Actionable Tips */}
                <section className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl">
                  <h5 className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-3">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Pro Tips for Better Visibility
                  </h5>
                  <ul className="space-y-2">
                    {result.improvements.map((imp, i) => (
                      <li key={i} className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                        <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-50" />
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </>
            )}
          </div>
          
          <div className="p-6 border-t flex justify-end bg-muted/10">
            <Button variant="default" onClick={() => setShowModal(false)} className="rounded-xl px-8">
              Close Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
