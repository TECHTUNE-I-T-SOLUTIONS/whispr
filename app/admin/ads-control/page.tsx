"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Shield, Monitor, Sparkles, Search, TrendingUp, Brain, BookOpen, Youtube, Github, Globe, Newspaper } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FeatureFlag {
  flag_name: string;
  enabled: boolean;
  description: string;
  rollout_percentage: number;
}

export default function AdsControlPage() {
  const [showAds, setShowAds] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [savingFlags, setSavingFlags] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Fetch current ads setting from Supabase
    async function fetchSetting() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/ads-settings");
        const data = await res.json();
        setShowAds(Boolean(data?.show_ads));
      } catch (e) {
        setError("Failed to fetch ads setting.");
      }
      setLoading(false);
    }
    fetchSetting();
  }, []);

  useEffect(() => {
    // Fetch feature flags
    async function fetchFeatureFlags() {
      try {
        const res = await fetch("/api/admin/feature-flags");
        if (res.ok) {
          const data = await res.json();
          setFeatureFlags(data.flags || []);
        }
      } catch (e) {
        console.error("Failed to fetch feature flags:", e);
      }
    }
    fetchFeatureFlags();
  }, []);

  async function handleToggle(value: boolean) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/ads-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ show_ads: value }),
      });
      if (!res.ok) throw new Error("Failed to update setting");
      setShowAds(value);
    } catch (e) {
      setError("Failed to update ads setting.");
    }
    setSaving(false);
  }

  async function handleFeatureToggle(flagName: string, enabled: boolean) {
    setSavingFlags(prev => ({ ...prev, [flagName]: true }));
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flag_name: flagName, enabled }),
      });
      if (!res.ok) throw new Error("Failed to update feature flag");
      setFeatureFlags(prev =>
        prev.map(flag =>
          flag.flag_name === flagName ? { ...flag, enabled } : flag
        )
      );
    } catch (e) {
      setError(`Failed to update ${flagName}`);
    }
    setSavingFlags(prev => ({ ...prev, [flagName]: false }));
  }

  const featureGroups = {
    engines: [
      { name: 'ENABLE_EDITOR_AI', icon: Sparkles, label: 'Editor AI', desc: 'AI-powered writing assistance (grammar, SEO, outlines, headlines)' },
      { name: 'ENABLE_RESEARCH_ENGINE', icon: BookOpen, label: 'Research Engine', desc: 'Multi-source research with AI synthesis' },
      { name: 'ENABLE_RECOMMENDATION_ENGINE', icon: Brain, label: 'Recommendation Engine', desc: 'Personalized content recommendations' },
      { name: 'ENABLE_TRENDING_ENGINE', icon: TrendingUp, label: 'Trending Engine', desc: 'Trending content from multiple sources' },
      { name: 'ENABLE_LEARNING_ENGINE', icon: Brain, label: 'Learning Engine', desc: 'AI-powered learning tools for creators' },
      { name: 'ENABLE_SMART_SEARCH', icon: Search, label: 'Smart Search', desc: 'Category-aware search with domain filtering' },
    ],
    providers: [
      { name: 'ENABLE_SEARCH_PROVIDER', icon: Globe, label: 'Google Search', desc: 'Programmable Search Engine integration' },
      { name: 'ENABLE_GOOGLE_NEWS_RSS', icon: Newspaper, label: 'Google News', desc: 'News from Google RSS feeds' },
      { name: 'ENABLE_WIKIPEDIA_PROVIDER', icon: Globe, label: 'Wikipedia', desc: 'Knowledge base integration' },
      { name: 'ENABLE_GITHUB_PROVIDER', icon: Github, label: 'GitHub', desc: 'Repository search and discovery' },
      { name: 'ENABLE_YOUTUBE_PROVIDER', icon: Youtube, label: 'YouTube', desc: 'Video search and trending' },
      { name: 'ENABLE_REDDIT_PROVIDER', icon: Globe, label: 'Reddit', desc: 'Community discussions and content' },
    ],
  };

  const getFlag = (name: string) => featureFlags.find(f => f.flag_name === name);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2">Platform Controls</h1>
          <p className="text-muted-foreground">Manage ads and AI features across the platform</p>
        </motion.div>

        <Tabs defaultValue="ads" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ads">Ads Control</TabsTrigger>
            <TabsTrigger value="ai">AI Features</TabsTrigger>
          </TabsList>

          <TabsContent value="ads">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-primary" />
                  <Monitor className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Adsterra Ads Control</CardTitle>
                <CardDescription>Toggle the visibility of Adsterra ads across the site</CardDescription>
              </CardHeader>
              <CardContent>
                {error && <div className="text-red-500 mb-4">{error}</div>}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <span className="font-medium">Show Ads</span>
                    <p className="text-sm text-muted-foreground mt-1">Display Adsterra advertisements on the site</p>
                  </div>
                  <Switch
                    checked={showAds}
                    disabled={loading || saving}
                    onCheckedChange={handleToggle}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-4">Current status: <span className={showAds ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{showAds ? "Enabled" : "Disabled"}</span></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <Sparkles className="w-8 h-8 text-purple-500 mb-2" />
                <CardTitle>AI Engines</CardTitle>
                <CardDescription>Control AI-powered features and engines</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {featureGroups.engines.map((feature) => {
                  const Icon = feature.icon;
                  const flag = getFlag(feature.name);
                  return (
                    <div key={feature.name} className="flex items-center justify-between p-4 bg-muted/50 dark:bg-muted/30 rounded-lg border border-border dark:border-border/50">
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 text-purple-500 mt-0.5" />
                        <div>
                          <span className="font-medium">{feature.label}</span>
                          <p className="text-sm text-muted-foreground mt-1">{feature.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={flag?.enabled || false}
                        disabled={savingFlags[feature.name]}
                        onCheckedChange={(checked) => handleFeatureToggle(feature.name, checked)}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="w-8 h-8 text-blue-500 mb-2" />
                <CardTitle>Content Providers</CardTitle>
                <CardDescription>Enable/disable external content providers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {featureGroups.providers.map((feature) => {
                  const Icon = feature.icon;
                  const flag = getFlag(feature.name);
                  return (
                    <div key={feature.name} className="flex items-center justify-between p-4 bg-muted/50 dark:bg-muted/30 rounded-lg border border-border dark:border-border/50">
                      <div className="flex items-start gap-3">
                        <Icon className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <span className="font-medium">{feature.label}</span>
                          <p className="text-sm text-muted-foreground mt-1">{feature.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={flag?.enabled || false}
                        disabled={savingFlags[feature.name]}
                        onCheckedChange={(checked) => handleFeatureToggle(feature.name, checked)}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
