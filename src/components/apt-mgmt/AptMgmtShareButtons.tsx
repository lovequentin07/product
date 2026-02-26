'use client';
// src/components/apt-mgmt/AptMgmtShareButtons.tsx

import { useState } from 'react';

export default function AptMgmtShareButtons() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // 두 방법 모두 실패 — 무시
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url: window.location.href });
      } catch {
        // 취소 또는 실패 — 무시
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 active:scale-95 text-white font-medium py-1.5 px-4 rounded-xl transition-colors text-xs"
      >
        {copied ? '✅ 복사됨' : '🔗 링크 복사'}
      </button>
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium py-1.5 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 active:scale-95 transition-colors text-xs"
      >
        공유하기
      </button>
    </div>
  );
}
