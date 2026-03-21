'use client';

import { useEffect, useState } from 'react';
import { Download, Apple, Smartphone, Calendar, Package, Check, Loader } from 'lucide-react';
import Image from 'next/image';

interface BuildInfo {
  version?: string;
  releaseDate?: string;
  buildTime?: string;
  changelog?: string;
  buildNumber?: string;
  buildStatus?: string;
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
  releaseName?: string;
}

export default function DownloadPage() {
  const [builds, setBuild] = useState<BuildInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuildInfo = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/builds/latest');
        if (!response.ok) throw new Error('Failed to fetch build info');
        const data = await response.json();
        setBuild(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch build details');
      } finally {
        setLoading(false);
      }
    };

    fetchBuildInfo();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-[#911A1B] to-red-600 bg-clip-text text-transparent mb-4">
            Whispr Mobile App
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
            Write, share, and connect on the go
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            Download the app for iOS or Android and start creating your chronicles today
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* iOS */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="bg-gradient-to-br from-[#911A1B] to-red-900 p-8 text-white flex flex-col items-center justify-center h-48">
              <Apple className="w-20 h-20 mb-4" />
              <h2 className="text-2xl font-bold">iOS</h2>
            </div>
            <div className="p-8">
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <p className="text-lg font-semibold mb-2">Coming Soon</p>
                <p className="text-sm">iOS builds will be available after TestFlight setup</p>
              </div>
            </div>
          </div>

          {/* Android */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="bg-gradient-to-br from-[#911A1B] to-red-800 p-8 text-white flex flex-col items-center justify-center h-48">
              <Smartphone className="w-20 h-20 mb-4" />
              <h2 className="text-2xl font-bold">Android</h2>
            </div>
            <div className="p-8">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader className="w-8 h-8 animate-spin text-green-600" />
                </div>
              ) : error ? (
                <div className="text-red-600 dark:text-red-400 text-center py-8">
                  <p>{error}</p>
                </div>
              ) : builds?.androidDownloadUrl ? (
                <>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-[#911A1B]" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Version</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          v{builds.version || 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-[#911A1B]" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Build Date</p>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {builds.buildTime
                            ? new Date(builds.buildTime).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric'
                              })
                            : 'Recently'}
                        </p>
                      </div>
                    </div>

                    {/* Download Options */}
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-semibold">
                        Download Options
                      </p>
                      <div className="space-y-2">
                        {builds.artifacts?.apk && (
                          <a
                            href={builds.artifacts.apk.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">APK</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {builds.artifacts.apk.sizeFormatted}
                              </p>
                            </div>
                            <Download className="w-4 h-4 text-[#911A1B]" />
                          </a>
                        )}
                        {builds.artifacts?.aab && (
                          <a
                            href={builds.artifacts.aab.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">AAB (Bundle)</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {builds.artifacts.aab.sizeFormatted}
                              </p>
                            </div>
                            <Download className="w-4 h-4 text-[#911A1B]" />
                          </a>
                        )}
                      </div>
                    </div>

                    {builds.changelog && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-semibold">
                          Build Info
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                          {builds.changelog}
                        </p>
                      </div>
                    )}
                  </div>
                  <a
                    href={builds.androidDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-[#911A1B] to-red-700 hover:from-red-800 hover:to-red-900 text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all duration-300"
                  >
                    <Download className="w-5 h-5" />
                    Quick Download (APK)
                  </a>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                    Direct download from Whispr Servers • Choose APK or AAB above for more options
                  </p>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="text-lg font-semibold mb-2">No builds available</p>
                  <p className="text-sm">Check back soon for the first build</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Why Download Whispr?
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Write Anywhere', desc: 'Create chronicles on the go' },
              { title: 'Instant Sharing', desc: 'Share your stories with the world instantly' },
              { title: 'Push Notifications', desc: 'Stay updated with engagement alerts' },
              { title: 'Offline Support', desc: 'Draft posts even without internet' },
              { title: 'Dark Mode', desc: 'Easy on the eyes, any time of day' },
              { title: 'Community', desc: 'Connect with millions of creators' },
            ].map((feature, idx) => (
              <div key={idx} className="flex gap-4">
                <Check className="w-6 h-6 text-[#911A1B] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-red-50 dark:bg-gray-800 rounded-2xl p-8 border border-[#911A1B] dark:border-red-900">
          <h3 className="text-lg font-semibold text-[#911A1B] dark:text-red-500 mb-4">
            Requirements
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-2">iOS</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                iOS 12.0 or later • iPhone, iPad, iPod touch
              </p>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white mb-2">Android</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Android 8.0 or later • Varies with device
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
