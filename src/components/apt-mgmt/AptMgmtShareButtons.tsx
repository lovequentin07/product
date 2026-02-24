'use client';
// src/components/apt-mgmt/AptMgmtShareButtons.tsx

import { useState } from 'react';

export default function AptMgmtShareButtons() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ url: window.location.href });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-1.5 px-4 rounded-xl transition-colors text-xs"
      >
        {copied ? '✅ 복사됨' : '🔗 링크 복사'}
      </button>
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium py-1.5 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs"
      >
        공유하기
      </button>
    </div>
  );
}
