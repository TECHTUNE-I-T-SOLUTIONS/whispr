"use client";
import { useEffect, useState } from "react";

export function CookieConsentModal() {
  const [open, setOpen] = useState(false);
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    // Check if consent is already given
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem("cookie_consent");
      if (!consent) setOpen(true);
      else setConsented(true);
    }
  }, []);

  const handleAccept = () => {
    setOpen(false);
    setConsented(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("cookie_consent", "true");
    }
  };

  if (!open || consented) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 max-w-md w-full text-center">
        <h2 className="text-lg font-semibold mb-2">Cookie Consent</h2>
        <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
          We use cookies to improve your experience, deliver personalized ads, features and analyze site traffic. By continuing to use this site, you consent to our use of cookies. See our <a href="/privacy" className="underline text-blue-600">Privacy Policy</a> for more info.
        </p>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleAccept}
        >
          Accept & Continue
        </button>
      </div>
    </div>
  );
}
