"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Shield, Monitor } from "lucide-react";

export default function AdsControlPage() {
  const [showAds, setShowAds] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-primary" />
          <Monitor className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Adsterra Ads Control</h1>
        <p className="text-muted-foreground mb-6">Toggle the visibility of Adsterra ads across the site.</p>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="font-medium">Show Ads</span>
          <Switch
            checked={showAds}
            disabled={loading || saving}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-primary"
          />
        </div>
        <div className="text-xs text-muted-foreground">Current status: <span className={showAds ? "text-green-600" : "text-red-600"}>{showAds ? "Enabled" : "Disabled"}</span></div>
      </motion.div>
    </div>
  );
}
