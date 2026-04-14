'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, Apple, Smartphone, Package, Calendar, Lock, Bot, Smartphone as MobileIcon, Zap } from 'lucide-react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

interface BuildInfo {
  version?: string;
  releaseDate?: string;
  buildTime?: string;
  androidDownloadUrl?: string;
  artifacts?: {
    apk?: {
      name: string;
      url: string;
      size: number;
      sizeFormatted: string;
    };
    aab?: {
      name: string;
      url: string;
      size: number;
      sizeFormatted: string;
    };
  };
}

export default function WhisprAIPage() {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [builds, setBuild] = useState<BuildInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchBuildInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/builds/latest');
        if (response.ok) {
          const data = await response.json();
          setBuild(data);
        }
      } catch (err) {
        console.error('Failed to fetch build info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBuildInfo();
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      mounted && resolvedTheme === 'dark' 
        ? 'bg-black' 
        : 'bg-gradient-to-br from-white via-gray-50 to-gray-100'
    }`}>
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className={`absolute inset-0 ${
          mounted && resolvedTheme === 'dark'
            ? 'bg-gradient-to-b from-red-600/10 via-black to-black'
            : 'bg-gradient-to-b from-red-600/5 via-white to-gray-100'
        }`}/>
        
        <div className="relative px-4 md:px-6 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Icon */}
            <div className="mb-8 inline-block">
              <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30">
                <Bot className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Title */}
            <h1 className={`text-5xl md:text-6xl font-bold mb-4 transition-colors ${
              mounted && resolvedTheme === 'dark'
                ? 'text-white'
                : 'text-black'
            }`}>
              Whispr <span className="text-red-600">AI</span>
            </h1>

            {/* Subtitle */}
            <p className={`text-xl md:text-2xl mb-6 transition-colors ${
              mounted && resolvedTheme === 'dark'
                ? 'text-gray-300'
                : 'text-gray-600'
            }`}>
              Your AI Writing Assistant
            </p>

            {/* Description */}
            <p className={`text-lg max-w-2xl mx-auto mb-8 transition-colors ${
              mounted && resolvedTheme === 'dark'
                ? 'text-gray-400'
                : 'text-gray-500'
            }`}>
              Whispr AI is currently available exclusively on mobile for premium users. Unlock powerful writing assistance with token-based access.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-4 md:px-6 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-12 transition-colors ${
            mounted && resolvedTheme === 'dark'
              ? 'text-white'
              : 'text-black'
          }`}>
            Why Whispr AI?
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Feature 1 */}
            <div className={`p-6 rounded-2xl transition-all duration-300 ${
              mounted && resolvedTheme === 'dark'
                ? 'bg-black border border-gray-800 hover:border-red-600/50'
                : 'bg-white border border-gray-200 hover:border-red-600/50'
            }`}>
              <div className="w-12 h-12 bg-red-600/10 rounded-lg flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-red-600" />
              </div>
              <h3 className={`text-xl font-bold mb-3 transition-colors ${
                mounted && resolvedTheme === 'dark'
                  ? 'text-white'
                  : 'text-black'
              }`}>
                Smart Suggestions
              </h3>
              <p className={`transition-colors ${
                mounted && resolvedTheme === 'dark'
                  ? 'text-gray-400'
                  : 'text-gray-600'
              }`}>
                Get intelligent writing suggestions and improvements in real-time as you create.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`p-6 rounded-2xl transition-all duration-300 ${
              mounted && resolvedTheme === 'dark'
                ? 'bg-black border border-gray-800 hover:border-red-600/50'
                : 'bg-white border border-gray-200 hover:border-red-600/50'
            }`}>
              <div className="w-12 h-12 bg-red-600/10 rounded-lg flex items-center justify-center mb-4">
                <MobileIcon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className={`text-xl font-bold mb-3 transition-colors ${
                mounted && resolvedTheme === 'dark'
                  ? 'text-white'
                  : 'text-black'
              }`}>
                Mobile First
              </h3>
              <p className={`transition-colors ${
                mounted && resolvedTheme === 'dark'
                  ? 'text-gray-400'
                  : 'text-gray-600'
              }`}>
                Write anywhere with our full-featured mobile experience designed for creativity on the go.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`p-6 rounded-2xl transition-all duration-300 ${
              mounted && resolvedTheme === 'dark'
                ? 'bg-black border border-gray-800 hover:border-red-600/50'
                : 'bg-white border border-gray-200 hover:border-red-600/50'
            }`}>
              <div className="w-12 h-12 bg-red-600/10 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-red-600" />
              </div>
              <h3 className={`text-xl font-bold mb-3 transition-colors ${
                mounted && resolvedTheme === 'dark'
                  ? 'text-white'
                  : 'text-black'
              }`}>
                Premium Feature
              </h3>
              <p className={`transition-colors ${
                mounted && resolvedTheme === 'dark'
                  ? 'text-gray-400'
                  : 'text-gray-600'
              }`}>
                Exclusive access for premium subscribers with flexible token-based pricing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Badge */}
      <div className="px-4 md:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className={`p-8 rounded-2xl border-2 border-red-600 transition-colors ${
            mounted && resolvedTheme === 'dark'
              ? 'bg-red-600/5'
              : 'bg-red-50'
          }`}>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-red-600">Premium Feature</h3>
            </div>
            <p className={`transition-colors ${
              mounted && resolvedTheme === 'dark'
                ? 'text-gray-300'
                : 'text-gray-700'
            }`}>
              Whispr AI is available exclusively on the mobile app for premium users. Use tokens to access powerful AI writing features including suggestions, content generation, and more. Download the app now to get started!
            </p>
          </div>
        </div>
      </div>

      {/* Download Section */}
      <div className="px-4 md:px-6 py-16 md:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-12 transition-colors ${
            mounted && resolvedTheme === 'dark'
              ? 'text-white'
              : 'text-black'
          }`}>
            Download Whispr App
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* iOS */}
            <div className={`rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${
              mounted && resolvedTheme === 'dark'
                ? 'bg-black border border-gray-800'
                : 'bg-white border border-gray-200'
            }`}>
              <div className="bg-gradient-to-br from-gray-900 to-black p-8 text-white flex flex-col items-center justify-center h-48">
                <Apple className="w-20 h-20 mb-4" />
                <h3 className="text-2xl font-bold">iOS</h3>
              </div>
              <div className="p-8">
                <div className="text-center py-8">
                  <p className={`text-lg font-semibold mb-2 transition-colors ${
                    mounted && resolvedTheme === 'dark'
                      ? 'text-white'
                      : 'text-black'
                  }`}>
                    Coming Soon
                  </p>
                  <p className={`text-sm transition-colors ${
                    mounted && resolvedTheme === 'dark'
                      ? 'text-gray-400'
                      : 'text-gray-600'
                  }`}>
                    iOS app coming after TestFlight setup
                  </p>
                </div>
              </div>
            </div>

            {/* Android */}
            <div className={`rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${
              mounted && resolvedTheme === 'dark'
                ? 'bg-black border border-gray-800'
                : 'bg-white border border-gray-200'
            }`}>
              <div className="bg-gradient-to-br from-red-600 to-[#000000] p-8 text-white flex flex-col items-center justify-center h-48">
                <Smartphone className="w-20 h-20 mb-4" />
                <h3 className="text-2xl font-bold">Android</h3>
              </div>
              <div className="p-8">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin">
                      <Zap className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                ) : builds?.androidDownloadUrl ? (
                  <>
                    <div className="space-y-4 mb-6">
                      {builds.version && (
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-red-600" />
                          <div>
                            <p className={`text-sm transition-colors ${
                              mounted && resolvedTheme === 'dark'
                                ? 'text-gray-400'
                                : 'text-gray-600'
                            }`}>Version</p>
                            <p className={`font-semibold transition-colors ${
                              mounted && resolvedTheme === 'dark'
                                ? 'text-white'
                                : 'text-black'
                            }`}>
                              v{builds.version}
                            </p>
                          </div>
                        </div>
                      )}
                      {builds.buildTime && (
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-red-600" />
                          <div>
                            <p className={`text-sm transition-colors ${
                              mounted && resolvedTheme === 'dark'
                                ? 'text-gray-400'
                                : 'text-gray-600'
                            }`}>Build Date</p>
                            <p className={`font-semibold transition-colors ${
                              mounted && resolvedTheme === 'dark'
                                ? 'text-white'
                                : 'text-black'
                            }`}>
                              {new Date(builds.buildTime).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Download Options */}
                      <div className={`border-t pt-4 mt-4 ${
                        mounted && resolvedTheme === 'dark'
                          ? 'border-gray-700'
                          : 'border-gray-200'
                      }`}>
                        <p className={`text-sm font-semibold mb-3 transition-colors ${
                          mounted && resolvedTheme === 'dark'
                            ? 'text-gray-300'
                            : 'text-gray-700'
                        }`}>
                          Download Options
                        </p>
                        <div className="space-y-2">
                          {builds.artifacts?.apk && (
                            <a
                              href={builds.artifacts.apk.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center justify-between p-3 rounded-lg transition-all hover:shadow-md ${
                                mounted && resolvedTheme === 'dark'
                                  ? 'bg-black border border-gray-700 hover:bg-gray-700'
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                            >
                              <div>
                                <p className={`text-sm font-semibold transition-colors ${
                                  mounted && resolvedTheme === 'dark'
                                    ? 'text-white'
                                    : 'text-black'
                                }`}>APK</p>
                                <p className={`text-xs transition-colors ${
                                  mounted && resolvedTheme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                                }`}>
                                  {builds.artifacts.apk.sizeFormatted}
                                </p>
                              </div>
                              <Download className="w-4 h-4 text-red-600" />
                            </a>
                          )}
                          {builds.artifacts?.aab && (
                            <a
                              href={builds.artifacts.aab.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center justify-between p-3 rounded-lg transition-all hover:shadow-md ${
                                mounted && resolvedTheme === 'dark'
                                  ? 'bg-black border border-gray-700 hover:bg-gray-700'
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                            >
                              <div>
                                <p className={`text-sm font-semibold transition-colors ${
                                  mounted && resolvedTheme === 'dark'
                                    ? 'text-white'
                                    : 'text-black'
                                }`}>App Bundle (AAB)</p>
                                <p className={`text-xs transition-colors ${
                                  mounted && resolvedTheme === 'dark'
                                    ? 'text-gray-400'
                                    : 'text-gray-600'
                                }`}>
                                  {builds.artifacts.aab.sizeFormatted}
                                </p>
                              </div>
                              <Download className="w-4 h-4 text-red-600" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={builds.androidDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-gradient-to-r from-red-600 to-[#911A1B] text-white font-bold py-3 rounded-lg text-center hover:from-red-700 hover:to-red-900 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Download Now
                    </Link>
                  </>
                ) : (
                  <div className={`text-center py-8 transition-colors ${
                    mounted && resolvedTheme === 'dark'
                      ? 'text-gray-400'
                      : 'text-gray-600'
                  }`}>
                    <p>No builds available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className={`mt-12 p-8 rounded-2xl transition-colors ${
            mounted && resolvedTheme === 'dark'
              ? 'bg-black border border-gray-800'
              : 'bg-gray-50 border border-gray-200'
          }`}>
            <h3 className={`text-xl font-bold mb-4 transition-colors ${
              mounted && resolvedTheme === 'dark'
                ? 'text-white'
                : 'text-black'
            }`}>
              Get Started with Whispr AI
            </h3>
            <ol className={`space-y-3 transition-colors ${
              mounted && resolvedTheme === 'dark'
                ? 'text-gray-300'
                : 'text-gray-700'
            }`}>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <span>Download the Whispr app on your mobile device</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <span>Sign up or log in with your account</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <span>Subscribe to premium to unlock AI features</span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                <span>Start using Whispr AI to enhance your writing</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className={`px-4 md:px-6 py-16 md:py-20 transition-colors ${
        mounted && resolvedTheme === 'dark'
          ? 'bg-red-600/5 border-t border-gray-800'
          : 'bg-red-50 border-t border-red-200'
      }`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-3xl md:text-4xl font-bold mb-6 transition-colors ${
            mounted && resolvedTheme === 'dark'
              ? 'text-white'
              : 'text-black'
          }`}>
            Ready to Unlock AI Writing Power?
          </h2>
          <p className={`text-lg mb-8 transition-colors ${
            mounted && resolvedTheme === 'dark'
              ? 'text-gray-300'
              : 'text-gray-700'
          }`}>
            Download the app and get started with Whispr AI today. Your next great story is just a tap away.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/download"
              className="inline-block px-8 py-3 bg-gradient-to-r from-red-600 to-[#911A1B] text-white font-bold rounded-lg hover:from-red-700 hover:to-red-900 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Download App
            </Link>
            <Link
              href="/chronicles/posts"
              className={`inline-block px-8 py-3 font-bold rounded-lg transition-all duration-300 border-2 border-red-600 ${
                mounted && resolvedTheme === 'dark'
                  ? 'text-red-400 hover:bg-red-600/10'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              Explore Posts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
