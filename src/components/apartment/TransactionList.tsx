"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { NormalizedTransaction } from '@/types/real-estate';

type SortField = keyof NormalizedTransaction | 'pricePerPyeong';
type SortDirection = 'asc' | 'desc';

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
  /** 시군구 코드 — 상세보기 URL 구성에 사용 */
  sggCd: string;
  /** 면적 필터 (평 단위, undefined=전체) */
  areaMin?: number;
  areaMax?: number;
  /** 가격 필터 (억 단위, undefined=전체) */
  priceMin?: number;
  priceMax?: number;
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
}) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const displayTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    let list = [...transactions];

    // 면적 필터 (평 단위)
    if (areaMin !== undefined) list = list.filter((t) => t.area * 0.3025 >= areaMin);
    if (areaMax !== undefined) list = list.filter((t) => t.area * 0.3025 <= areaMax);
    // 가격 필터 (억 단위)
    if (priceMin !== undefined) list = list.filter((t) => t.price / 10000 >= priceMin);
    if (priceMax !== undefined) list = list.filter((t) => t.price / 10000 <= priceMax);

    list.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      if (sortField === 'pricePerPyeong') {
        aValue = a.area * 0.3025 > 0 ? a.price / (a.area * 0.3025) : 0;
        bValue = b.area * 0.3025 > 0 ? b.price / (b.area * 0.3025) : 0;
      } else {
        aValue = a[sortField as keyof NormalizedTransaction] as number | string;
        bValue = b[sortField as keyof NormalizedTransaction] as number | string;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return 0;
    });

    return list;
  }, [transactions, sortField, sortDirection, areaMin, areaMax, priceMin, priceMax]);

  const getSortIndicator = (field: SortField) =>
    sortField === field ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : '';

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
        <p className="text-sm mt-2">API 키 확인 또는 요청 정보를 다시 확인해주세요.</p>
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
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 responsive-table">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <Th onClick={() => handleSort('aptName')}>아파트명{getSortIndicator('aptName')}</Th>
              <Th onClick={() => handleSort('date')}>거래일{getSortIndicator('date')}</Th>
              <Th onClick={() => handleSort('price')}>거래금액(억){getSortIndicator('price')}</Th>
              <Th onClick={() => handleSort('pricePerPyeong')}>평당금액(억){getSortIndicator('pricePerPyeong')}</Th>
              <Th onClick={() => handleSort('area')}>전용면적(평){getSortIndicator('area')}</Th>
              <Th onClick={() => handleSort('floor')}>층{getSortIndicator('floor')}</Th>
              <Th onClick={() => handleSort('address')}>법정동{getSortIndicator('address')}</Th>
              <Th onClick={() => handleSort('buildYear')}>건축년도{getSortIndicator('buildYear')}</Th>
              <Th>상태</Th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                상세
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {displayTransactions.map((transaction) => {
              const pyeong = transaction.area * 0.3025;
              const pricePerPyeong = pyeong > 0 ? transaction.price / pyeong : 0;
              const isSelected = searchTerm && transaction.aptName.toLowerCase().includes(searchTerm.toLowerCase());
              const detailHref = `/real-estate/apt/${sggCd}/${encodeURIComponent(transaction.aptName)}`;

              return (
                <tr key={transaction.id} className={isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                  <td
                    className={`px-4 py-4 whitespace-nowrap text-sm font-medium cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 ${
                      isSelected ? 'text-blue-800 dark:text-blue-300 font-bold' : 'text-gray-900 dark:text-gray-100'
                    }`}
                    data-label="아파트명"
                    onClick={() => onSearchTermChange(isSelected ? '' : transaction.aptName)}
                  >
                    {transaction.aptName}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" data-label="거래일">
                    {transaction.date}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 dark:text-blue-400" data-label="거래금액">
                    {(transaction.price / 10000).toFixed(1)}억
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-red-600 dark:text-red-400" data-label="평당금액">
                    {(pricePerPyeong / 10000).toFixed(1)}억
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" data-label="전용면적">
                    {Math.round(pyeong)}평
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" data-label="층">
                    {transaction.floor}층
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" data-label="법정동">
                    {transaction.address}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400" data-label="건축년도">
                    {transaction.buildYear}년
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm" data-label="상태">
                    {transaction.isCancelled && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                        해제
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm" data-label="상세">
                    <Link
                      href={detailHref}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      title={`${transaction.aptName} 상세 보기`}
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

      {/* 페이지네이션 */}
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
            <div className="hidden sm:flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm rounded-md ${
                    page === currentPage
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {page}
                </button>
              ))}
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

      {/* 더보기 */}
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

// ── 작은 헬퍼 컴포넌트 ──────────────────────────────────────────────────────

function Th({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <th
      scope="col"
      onClick={onClick}
      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider${onClick ? ' cursor-pointer hover:text-gray-700 dark:hover:text-gray-200' : ''}`}
    >
      {children}
    </th>
  );
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
