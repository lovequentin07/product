"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NormalizedTransaction } from '@/types/real-estate';
import TransactionList from '@/components/apartment/TransactionList';
import SummaryCards from '@/components/apartment/SummaryCards';

// 면적 필터 옵션 (평 단위)
const AREA_OPTIONS = [
  { label: '전체', min: undefined, max: undefined },
  { label: '~20평', min: undefined, max: 20 },
  { label: '20~30평', min: 20, max: 30 },
  { label: '30~40평', min: 30, max: 40 },
  { label: '40평+', min: 40, max: undefined },
] as const;

// 가격 필터 옵션 (억 단위)
const PRICE_OPTIONS = [
  { label: '전체', min: undefined, max: undefined },
  { label: '~5억', min: undefined, max: 5 },
  { label: '5~10억', min: 5, max: 10 },
  { label: '10~20억', min: 10, max: 20 },
  { label: '20억+', min: 20, max: undefined },
] as const;

export default function TransactionsClientComponent({
  transactions,
  totalCount,
  currentPage,
  itemsPerPage,
  isLoading,
  error,
  searchTerm,
  sggCd,
  sortBy,
  sortDir,
}: {
  transactions: NormalizedTransaction[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  sggCd: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [areaOptionIndex, setAreaOptionIndex] = useState(0);
  const [priceOptionIndex, setPriceOptionIndex] = useState(0);

  const urlSortBy = searchParams.get('sortBy') || sortBy;
  const urlSortDir = (searchParams.get('sortDir') || sortDir) as 'asc' | 'desc';

  const areaOption = AREA_OPTIONS[areaOptionIndex];
  const priceOption = PRICE_OPTIONS[priceOptionIndex];

  // URL의 searchTerm이 바뀌면 로컬 상태 동기화
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // 500ms 디바운스로 URL 업데이트
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearchTerm !== searchTerm) {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        if (localSearchTerm.trim()) {
          current.set('searchTerm', localSearchTerm.trim());
        } else {
          current.delete('searchTerm');
        }
        current.set('pageNo', '1');
        router.push(`?${current.toString()}`, { scroll: false });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [localSearchTerm, searchTerm, router, searchParams]);

  const handleSortChange = (dbField: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    const newDir = urlSortBy === dbField && urlSortDir === 'desc' ? 'asc' : 'desc';
    current.set('sortBy', dbField);
    current.set('sortDir', newDir);
    current.set('pageNo', '1');
    router.push(`?${current.toString()}`, { scroll: false });
  };

  const handlePageChange = (newPage: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('pageNo', String(newPage));
    if (localSearchTerm) current.set('searchTerm', localSearchTerm);
    else current.delete('searchTerm');
    router.push(`?${current.toString()}`);
  };

  const handleLoadMore = () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('numOfRows', String(itemsPerPage + 15));
    current.set('pageNo', '1');
    if (localSearchTerm) current.set('searchTerm', localSearchTerm);
    else current.delete('searchTerm');
    router.push(`?${current.toString()}`);
  };

  // 아파트명 검색어로 클라이언트 필터링 (즉각 반응)
  const clientFilteredTransactions = useMemo(() => {
    if (!localSearchTerm) return transactions;
    const lower = localSearchTerm.toLowerCase();
    return transactions.filter((t) => t.aptName.toLowerCase().includes(lower));
  }, [transactions, localSearchTerm]);

  const displayTotalCount = totalCount;

  return (
    <div>
      {/* 요약 카드 */}
      <SummaryCards transactions={transactions} totalCount={totalCount} />

      {/* 면적 / 가격 필터 */}
      <div className="max-w-6xl mx-auto mb-3 flex flex-wrap gap-3 px-4 sm:px-0">
        <FilterBar
          label="면적"
          options={AREA_OPTIONS.map((o) => o.label)}
          selected={areaOptionIndex}
          onChange={setAreaOptionIndex}
        />
        <FilterBar
          label="가격"
          options={PRICE_OPTIONS.map((o) => o.label)}
          selected={priceOptionIndex}
          onChange={setPriceOptionIndex}
        />
      </div>

      <TransactionList
        transactions={clientFilteredTransactions}
        totalCount={displayTotalCount}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        isLoading={isLoading}
        error={error}
        onPageChange={handlePageChange}
        onLoadMore={handleLoadMore}
        searchTerm={localSearchTerm}
        onSearchTermChange={setLocalSearchTerm}
        sggCd={sggCd}
        areaMin={areaOption.min}
        areaMax={areaOption.max}
        priceMin={priceOption.min}
        priceMax={priceOption.max}
        sortBy={urlSortBy}
        sortDir={urlSortDir}
        onSortChange={handleSortChange}
      />
    </div>
  );
}

// ── 필터 바 컴포넌트 ─────────────────────────────────────────────────────────

function FilterBar({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly string[];
  selected: number;
  onChange: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1">{label}</span>
      {options.map((opt, i) => (
        <button
          key={opt}
          onClick={() => onChange(i)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            selected === i
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
