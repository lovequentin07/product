'use client';
// src/components/apt-mgmt/AptMgmtSearchForm.tsx
// 구 드롭다운(선택) + 아파트 텍스트 자동완성 → 제출

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { regions } from '@shared/data/regions';
import { MgmtFeeApt } from '@apt-mgmt/types/management-fee';

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
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      .then((r) => {
        if (!r.ok) throw new Error(`서버 오류 (${r.status})`);
        return r.json() as Promise<MgmtFeeApt[]>;
      })
      .then((data) => setApts(Array.isArray(data) ? data : []))
      .catch(() => setError('아파트 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, [sggNm]);

  // 구 미선택 + 이름 입력 시 전체 검색 (디바운스 400ms)
  const fetchSearch = (q: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim()) { setApts([]); return; }
    searchTimer.current = setTimeout(() => {
      setLoading(true);
      setError('');
      fetch(`/api/apt-mgmt/apts?q=${encodeURIComponent(q)}`)
        .then((r) => {
          if (!r.ok) throw new Error(`서버 오류 (${r.status})`);
          return r.json() as Promise<MgmtFeeApt[]>;
        })
        .then((data) => setApts(Array.isArray(data) ? data : []))
        .catch(() => setError('검색에 실패했습니다.'))
        .finally(() => setLoading(false));
    }, 400);
  };

  // 클라이언트 필터링 (구 선택 시) 또는 서버 결과 그대로 (전체 검색 시)
  const filtered = (() => {
    if (sggNm) {
      const q = inputValue.replace(/\s+/g, '').toLowerCase();
      if (!q) return apts.slice(0, 50);
      return apts
        .filter((a) => {
          const nm = a.apt_nm.replace(/\s+/g, '').toLowerCase();
          const umd = (a.umd_nm ?? '').toLowerCase();
          return nm.includes(q) || umd.includes(q);
        })
        .slice(0, 50);
    }
    return apts; // 전체 검색은 서버가 50개 제한
  })();

  const handleSelect = (apt: MgmtFeeApt) => {
    setSelectedApt(apt);
    setInputValue(apt.apt_nm);
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setSelectedApt(null);
    setShowDropdown(true);
    if (!sggNm) fetchSearch(val);
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
    if (!selectedApt) return;
    const district = selectedApt.sgg_nm ?? sggNm;
    if (!district) return;
    router.push(
      `/apt-mgmt/${encodeURIComponent(district)}/${encodeURIComponent(selectedApt.apt_nm)}?kaptCode=${selectedApt.kapt_code}`
    );
  };

  const canSubmit = !!selectedApt && !!(selectedApt.sgg_nm ?? sggNm);

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">아파트 관리비 분석</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 서울시 (고정) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">시/도</label>
          <input
            readOnly
            value="서울특별시"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-(--ds-cream-muted) text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* 구 선택 (선택사항) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            구 선택 <span className="text-gray-400 font-normal">(선택사항)</span>
          </label>
          <select
            value={sggNm}
            onChange={(e) => setSggNm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-(--ds-accent)"
          >
            <option value="">-- 전체 --</option>
            {SEOUL_DISTRICTS.map((r) => (
              <option key={r.code} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* 아파트 자동완성 */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">아파트 검색</label>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={loading && !!sggNm}
            placeholder={loading ? '불러오는 중...' : '아파트명을 입력하세요'}
            autoComplete="off"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-(--ds-accent) disabled:bg-(--ds-cream-muted) disabled:text-gray-400 placeholder:text-gray-400"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

          {/* 드롭다운 */}
          {showDropdown && filtered.length > 0 && (
            <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filtered.map((a) => (
                <li
                  key={a.kapt_code}
                  onMouseDown={() => handleSelect(a)}
                  className="flex items-baseline justify-between px-3 py-2 cursor-pointer hover:bg-(--ds-accent-faint) text-sm"
                >
                  <span className="font-medium text-gray-900">{a.apt_nm}</span>
                  <span className="ml-2 text-xs text-gray-400 shrink-0">
                    {[a.sgg_nm, a.umd_nm].filter(Boolean).join(' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {showDropdown && !loading && inputValue && filtered.length === 0 && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-500">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        style={{ background: 'var(--ds-accent)' }}
        className="w-full hover:opacity-80 active:opacity-70 active:scale-95 disabled:bg-gray-300 text-white font-semibold py-2.5 px-4 rounded-lg transition-opacity text-sm"
      >
        관리비 분석 시작
      </button>
    </form>
  );
}
