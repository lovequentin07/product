'use client';
// src/components/apt-mgmt/AptMgmtSearchForm.tsx
// 구 드롭다운 → 아파트 텍스트 입력(자동완성) → 제출

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { regions } from '@/data/regions';
import { MgmtFeeApt } from '@/types/management-fee';

const SEOUL_DISTRICTS = regions
  .filter((r) => r.parent === '서울특별시')
  .sort((a, b) => a.name.localeCompare(b.name, 'ko'));

export default function AptMgmtSearchForm() {
  const router = useRouter();
  const [sggNm, setSggNm] = useState('');
  const [apts, setApts] = useState<MgmtFeeApt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 자동완성 상태
  const [inputValue, setInputValue] = useState('');
  const [selectedApt, setSelectedApt] = useState<MgmtFeeApt | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 구 변경 시 아파트 목록 로드 + 선택 초기화
  useEffect(() => {
    setSelectedApt(null);
    setInputValue('');
    setShowDropdown(false);
    setApts([]);
    if (!sggNm) return;

    setLoading(true);
    setError('');
    fetch(`/api/apt-mgmt/apts?sgg_nm=${encodeURIComponent(sggNm)}`)
      .then((r) => r.json() as Promise<MgmtFeeApt[]>)
      .then((data) => setApts(Array.isArray(data) ? data : []))
      .catch(() => setError('아파트 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [sggNm]);

  // 클라이언트 필터링
  const filtered = (() => {
    const q = inputValue.replace(/\s+/g, '').toLowerCase();
    if (!q) return apts.slice(0, 50);
    return apts
      .filter((a) => {
        const nm = a.apt_nm.replace(/\s+/g, '').toLowerCase();
        const umd = (a.umd_nm ?? '').toLowerCase();
        return nm.includes(q) || umd.includes(q);
      })
      .slice(0, 50);
  })();

  const handleSelect = (apt: MgmtFeeApt) => {
    setSelectedApt(apt);
    setInputValue(apt.apt_nm);
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setSelectedApt(null);
    setShowDropdown(true);
  };

  const handleFocus = () => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    if (apts.length > 0) setShowDropdown(true);
  };

  const handleBlur = () => {
    blurTimer.current = setTimeout(() => setShowDropdown(false), 150);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sggNm || !selectedApt) return;
    router.push(
      `/apt-mgmt/${encodeURIComponent(sggNm)}/${encodeURIComponent(selectedApt.apt_nm)}?kaptCode=${selectedApt.kapt_code}`
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
              <option key={r.code} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* 아파트 자동완성 */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">아파트 검색</label>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={!sggNm || loading}
            placeholder={
              loading ? '불러오는 중...' :
              !sggNm ? '구를 먼저 선택하세요' :
              '아파트명 입력'
            }
            autoComplete="off"
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 placeholder:text-gray-400"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

          {/* 드롭다운 */}
          {showDropdown && filtered.length > 0 && (
            <ul className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filtered.map((a) => (
                <li
                  key={a.kapt_code}
                  onMouseDown={() => handleSelect(a)}
                  className="flex items-baseline justify-between px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">{a.apt_nm}</span>
                  {a.umd_nm && (
                    <span className="ml-2 text-xs text-gray-400 dark:text-gray-500 shrink-0">{a.umd_nm}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {showDropdown && sggNm && !loading && filtered.length === 0 && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={!sggNm || !selectedApt}
        className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 active:scale-[0.98] disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-all text-sm"
      >
        관리비 분석 시작
      </button>
    </form>
  );
}
