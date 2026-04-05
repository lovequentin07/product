'use client';
// src/apt-mgmt/components/AptMgmtSearchForm.tsx
// 아파트 이름 직접 검색 (전체 검색, 구 드롭다운 제거)

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MgmtFeeApt } from '@apt-mgmt/types/management-fee';

export default function AptMgmtSearchForm() {
  const router = useRouter();
  const [apts, setApts] = useState<MgmtFeeApt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [inputValue, setInputValue] = useState('');
  const [selectedApt, setSelectedApt] = useState<MgmtFeeApt | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSearch = (q: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim()) {
      setApts([]);
      setShowDropdown(false);
      return;
    }
    searchTimer.current = setTimeout(() => {
      setLoading(true);
      setError('');
      fetch(`/api/apt-mgmt/apts?q=${encodeURIComponent(q)}`)
        .then((r) => {
          if (!r.ok) throw new Error(`서버 오류 (${r.status})`);
          return r.json() as Promise<MgmtFeeApt[]>;
        })
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          setApts(list);
          setShowDropdown(list.length > 0);
        })
        .catch(() => setError('검색에 실패했습니다.'))
        .finally(() => setLoading(false));
    }, 400);
  };

  const handleSelect = (apt: MgmtFeeApt) => {
    setSelectedApt(apt);
    setInputValue(apt.apt_nm);
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setSelectedApt(null);
    fetchSearch(val);
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
    const district = selectedApt.sgg_nm;
    if (!district) return;
    router.push(
      `/apt-mgmt/${encodeURIComponent(district)}/${encodeURIComponent(selectedApt.apt_nm)}?kaptCode=${selectedApt.kapt_code}`
    );
  };

  const canSubmit = !!selectedApt && !!selectedApt.sgg_nm;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="아파트 이름을 입력하세요 (예: 래미안대치팰리스)"
          autoComplete="off"
          className="w-full border-2 rounded-xl px-4 py-3.5 text-base bg-white focus:outline-none transition-colors placeholder:text-gray-400"
          style={{
            borderColor: 'var(--ds-cream-border)',
            color: 'var(--ds-ink)',
          }}
          onFocusCapture={(e) => {
            (e.target as HTMLInputElement).style.borderColor = 'var(--ds-accent)';
          }}
          onBlurCapture={(e) => {
            (e.target as HTMLInputElement).style.borderColor = 'var(--ds-cream-border)';
          }}
        />

        {/* 로딩 인디케이터 */}
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div
              className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--ds-accent)', borderTopColor: 'transparent' }}
            />
          </div>
        )}

        {/* 드롭다운 */}
        {showDropdown && apts.length > 0 && (
          <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg max-h-64 overflow-y-auto"
            style={{ borderColor: 'var(--ds-cream-border)' }}>
            {apts.map((a) => (
              <li
                key={a.kapt_code}
                onMouseDown={() => handleSelect(a)}
                className="flex items-baseline justify-between px-4 py-2.5 cursor-pointer transition-colors text-sm"
                style={{ color: 'var(--ds-ink)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLLIElement).style.background = 'var(--ds-accent-faint)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLLIElement).style.background = '';
                }}
              >
                <span className="font-medium">{a.apt_nm}</span>
                <span className="ml-2 text-xs shrink-0" style={{ color: 'var(--ds-ink-faint)' }}>
                  {[a.sgg_nm, a.umd_nm].filter(Boolean).join(' ')}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* 검색 결과 없음 */}
        {showDropdown && !loading && inputValue.trim() && apts.length === 0 && (
          <div className="absolute z-20 left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg px-4 py-3 text-sm"
            style={{ borderColor: 'var(--ds-cream-border)', color: 'var(--ds-ink-faint)' }}>
            검색 결과가 없습니다.
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        style={{ background: canSubmit ? 'var(--ds-accent)' : undefined }}
        className="w-full disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-xl transition-opacity hover:opacity-85 active:opacity-70 active:scale-[0.99] text-base"
      >
        관리비 분석 시작
      </button>
    </form>
  );
}
