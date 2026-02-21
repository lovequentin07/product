"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { NormalizedTransaction } from '@/types/real-estate';

/** sggCd가 '11000'이면 서울 전체 조회 모드 */
const isAllSeoul = (sggCd: string) => sggCd === '11000';

interface TransactionListProps {
  transactions: NormalizedTransaction[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onLoadMore: () => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  sggCd: string;
  areaMin?: number;
  areaMax?: number;
  priceMin?: number;
  priceMax?: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSortChange: (dbField: string) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isLoading,
  error,
  totalCount,
  currentPage,
  itemsPerPage,
  onPageChange,
  onLoadMore,
  searchTerm,
  onSearchTermChange,
  sggCd,
  areaMin,
  areaMax,
  priceMin,
  priceMax,
  sortBy,
  sortDir,
  onSortChange,
}) => {
  const showGuColumn = isAllSeoul(sggCd);

  const displayTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    let list = [...transactions];

    // 면적 필터 (평 단위, area는 ㎡ → 평 변환)
    if (areaMin !== undefined) list = list.filter((t) => t.area * 0.3025 >= areaMin);
    if (areaMax !== undefined) list = list.filter((t) => t.area * 0.3025 <= areaMax);
    // 가격 필터 (억 단위)
    if (priceMin !== undefined) list = list.filter((t) => t.price / 10000 >= priceMin);
    if (priceMax !== undefined) list = list.filter((t) => t.price / 10000 <= priceMax);

    return list;
  }, [transactions, areaMin, areaMax, priceMin, priceMax]);

  const ind = (f: string) => (sortBy === f ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '');
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const canLoadMore = currentPage * itemsPerPage < totalCount;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-500 dark:text-gray-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100" />
        <p className="ml-3 text-lg">데이터 로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg max-w-6xl mx-auto my-4">
        <p className="font-bold">오류 발생:</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto my-4 px-4 sm:px-0">
        <SearchInput value={searchTerm} onChange={onSearchTermChange} />
        <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 rounded-lg text-center">
          <p>
            {searchTerm
              ? `'${searchTerm}'에 해당하는 검색 결과가 없습니다.`
              : '선택하신 조건에 해당하는 실거래가 정보가 없습니다.'}
          </p>
          {searchTerm && (
            <button onClick={() => onSearchTermChange('')} className="mt-2 text-blue-600 dark:text-blue-400 underline">
              검색 초기화
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-4 px-4 sm:px-0">
      <SearchInput value={searchTerm} onChange={onSearchTermChange} />

      <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg border border-transparent dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <Th onClick={() => onSortChange('apt_nm')}>아파트명{ind('apt_nm')}</Th>
              {showGuColumn && <Th onClick={() => onSortChange('sgg_nm')}>구{ind('sgg_nm')}</Th>}
              <Th>동</Th>
              <Th onClick={() => onSortChange('deal_date')}>거래일{ind('deal_date')}</Th>
              <Th onClick={() => onSortChange('deal_amount_billion')} right>가격(억){ind('deal_amount_billion')}</Th>
              <Th onClick={() => onSortChange('price_per_pyeong')} right>평당가(억){ind('price_per_pyeong')}</Th>
              <Th onClick={() => onSortChange('area_pyeong')} right>면적(평){ind('area_pyeong')}</Th>
              <Th onClick={() => onSortChange('floor')} right>층{ind('floor')}</Th>
              <Th onClick={() => onSortChange('build_year')} right>건축년도{ind('build_year')}</Th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                상세
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {displayTransactions.map((t) => {
              const pyeong = t.area * 0.3025;
              const pricePerPyeong = pyeong > 0 ? t.price / pyeong : 0;
              const isSelected = searchTerm && t.aptName.toLowerCase().includes(searchTerm.toLowerCase());
              const detailHref = `/real-estate/apt/${sggCd}/${encodeURIComponent(t.aptName)}`;

              return (
                <tr key={t.id} className={isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}>
                  <td
                    className={`px-4 py-3 whitespace-nowrap text-sm font-medium cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 ${
                      isSelected ? 'text-blue-700 dark:text-blue-300 font-bold' : 'text-gray-900 dark:text-gray-100'
                    }`}
                    onClick={() => onSearchTermChange(isSelected ? '' : t.aptName)}
                  >
                    {t.aptName}
                  </td>
                  {showGuColumn && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {t.sggNm ?? '—'}
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {t.address}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {t.date}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-700 dark:text-slate-200 text-right">
                    {(t.price / 10000).toFixed(1)}억
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-amber-600 dark:text-amber-400 text-right">
                    {(pricePerPyeong / 10000).toFixed(1)}억
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                    {Math.round(pyeong)}평
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                    {t.floor}층
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-right">
                    {t.buildYear}년
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <Link
                      href={detailHref}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      상세 →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {displayTransactions.length === 0 && (
        <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300 rounded-lg text-center mt-4">
          <p>현재 필터 조건에 해당하는 결과가 없습니다.</p>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6 rounded-lg shadow-md mt-4">
          <div className="flex-1 flex justify-between sm:justify-end gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <div className="hidden sm:flex gap-1 items-center">
              {getPageWindow(currentPage, totalPages).map((page, i) =>
                page === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-gray-400 dark:text-gray-500 select-none">…</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm rounded-md ${
                      page === currentPage
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </nav>
      )}

      {canLoadMore && (
        <div className="text-center mt-4">
          <button
            onClick={onLoadMore}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            더보기 ({totalCount - currentPage * itemsPerPage}개 남음)
          </button>
        </div>
      )}
    </div>
  );
};

function Th({ children, onClick, right }: { children: React.ReactNode; onClick?: () => void; right?: boolean }) {
  return (
    <th
      scope="col"
      onClick={onClick}
      className={`px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider${right ? ' text-right' : ' text-left'}${onClick ? ' cursor-pointer hover:text-gray-700 dark:hover:text-gray-200' : ''}`}
    >
      {children}
    </th>
  );
}

/** 현재 페이지 기준 윈도우 페이지 번호 목록 반환 (최대 9개 + 생략부호) */
function getPageWindow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '…')[] = [1];
  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);

  if (start > 2) pages.push('…');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('…');
  pages.push(total);

  return pages;
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-3">
      <input
        type="text"
        placeholder="아파트명으로 검색 (클릭 시 필터, 다시 클릭 시 해제)..."
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default TransactionList;
