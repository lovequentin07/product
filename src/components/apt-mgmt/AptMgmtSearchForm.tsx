'use client';
// src/components/apt-mgmt/AptMgmtSearchForm.tsx
// 구 드롭다운 → 아파트 드롭다운 → 제출

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { regions } from '@/data/regions';
import { MgmtFeeApt } from '@/types/management-fee';

const SEOUL_DISTRICTS = regions
  .filter((r) => r.parent === '서울특별시')
  .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

export default function AptMgmtSearchForm() {
  const router = useRouter();
  const [sggNm, setSggNm] = useState('');
  const [kaptCode, setKaptCode] = useState('');
  const [apts, setApts] = useState<MgmtFeeApt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // sggNm이 없으면 빈 목록으로 파생 — effect 내 직접 setState 불필요
  const visibleApts = sggNm ? apts : [];
  const effectiveKaptCode = sggNm ? kaptCode : '';

  useEffect(() => {
    if (!sggNm) return;
    setLoading(true);
    setError('');
    fetch(`/api/apt-mgmt/apts?sgg_nm=${encodeURIComponent(sggNm)}`)
      .then((r) => r.json() as Promise<MgmtFeeApt[]>)
      .then((data) => {
        setApts(data);
        setKaptCode('');
      })
      .catch(() => setError('아파트 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [sggNm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sggNm || !effectiveKaptCode) return;
    const apt = visibleApts.find((a) => a.kapt_code === effectiveKaptCode);
    if (!apt) return;
    router.push(
      `/apt-mgmt/${encodeURIComponent(sggNm)}/${encodeURIComponent(apt.apt_nm)}?kaptCode=${effectiveKaptCode}`
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">아파트 관리비 분석</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 서울시 (고정) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">시/도</label>
          <input
            readOnly
            value="서울특별시"
            className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
        </div>

        {/* 구 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">구 선택</label>
          <select
            value={sggNm}
            onChange={(e) => setSggNm(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- 구를 선택하세요 --</option>
            {SEOUL_DISTRICTS.map((r) => (
              <option key={r.code} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* 아파트 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">아파트 선택</label>
          <select
            value={effectiveKaptCode}
            onChange={(e) => setKaptCode(e.target.value)}
            disabled={!sggNm || loading}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500"
          >
            <option value="">
              {loading ? '불러오는 중...' : visibleApts.length === 0 && sggNm ? '단지 정보 없음' : '-- 아파트를 선택하세요 --'}
            </option>
            {visibleApts.map((a) => (
              <option key={a.kapt_code} value={a.kapt_code}>
                {a.apt_nm}{a.umd_nm ? ` (${a.umd_nm})` : ''}
              </option>
            ))}
          </select>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={!sggNm || !effectiveKaptCode}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
      >
        관리비 분석 시작
      </button>
    </form>
  );
}
