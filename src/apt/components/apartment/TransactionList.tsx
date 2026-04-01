"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { NormalizedTransaction } from '@apt/types/real-estate';
import { getRegionNameByCode } from '@shared/data/regions';

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
  onSearchTermSelect?: (term: string) => void;
  sggCd: string;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  onSortChange: (dbField: string) => void;
  hideSearch?: boolean;
  hideDetailLink?: boolean;
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
  onSearchTermSelect,
  sggCd,
  sortBy,
  sortDir,
  onSortChange,
  hideSearch = false,
  hideDetailLink = false,
}) => {
  const showGuColumn = isAllSeoul(sggCd);

  const displayTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    return [...transactions];
  }, [transactions]);

  const ind = (f: string) => (sortBy === f ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '');
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const canLoadMore = currentPage * itemsPerPage < totalCount;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
        <p className="ml-3 text-lg">데이터 로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-6xl mx-auto my-4">
        <p className="font-bold">오류 발생:</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="max-w-6xl mx-auto my-4 px-4 sm:px-0">
        {!hideSearch && <SearchInput value={searchTerm} onChange={onSearchTermChange} />}
        <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg text-center">
          <p>
            {searchTerm
              ? `'${searchTerm}'에 해당하는 검색 결과가 없습니다.`
              : '선택하신 조건에 해당하는 실거래가 정보가 없습니다.'}
          </p>
          {searchTerm && (
            <button onClick={() => onSearchTermChange('')} className="mt-2 underline" style={{ color: 'var(--ds-accent)' }}>
              검색 초기화
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-4 px-4 sm:px-0">
      {!hideSearch && <SearchInput value={searchTerm} onChange={onSearchTermChange} />}

      <div className="overflow-x-auto bg-white shadow-md rounded-lg border border-transparent">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
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
              {!hideDetailLink && (
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상세
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayTransactions.map((t) => {
              const pyeong = t.area * 0.3025;
              const pricePerPyeong = pyeong > 0 ? t.price / pyeong : 0;
              const isSelected = searchTerm && t.aptName.toLowerCase().includes(searchTerm.toLowerCase());
              const effectiveSggNm = t.sggNm || getRegionNameByCode(sggCd);
              const detailHref = effectiveSggNm
                ? `/apt/${encodeURIComponent(effectiveSggNm)}/${encodeURIComponent(t.aptName)}`
                : `/apt?lawdCd=${sggCd}`;

              return (
                <tr key={t.id} className={isSelected ? '' : 'hover:bg-gray-50'} style={isSelected ? { background: 'var(--ds-accent-faint)' } : undefined}>
                  <td
                    className={`px-4 py-3 whitespace-nowrap text-sm font-medium cursor-pointer ${
                      isSelected ? 'font-bold' : 'text-gray-900'
                    }`}
                    style={isSelected ? { color: 'var(--ds-accent)' } : undefined}
                    onClick={() => onSearchTermSelect
                      ? onSearchTermSelect(t.aptName)
                      : onSearchTermChange(isSelected ? '' : t.aptName)
                    }
                  >
                    {t.aptName}
                    <DealTypeBadge dealType={t.dealType} />
                  </td>
                  {showGuColumn && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {t.sggNm ?? '—'}
                    </td>
                  )}
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {t.address}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {t.date}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-700 text-right">
                    {(t.price / 10000).toFixed(1)}억
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-amber-600 text-right">
                    {(pricePerPyeong / 10000).toFixed(1)}억
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                    {Math.round(pyeong)}평
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                    {t.floor}층
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">
                    {t.buildYear}년
                  </td>
                  {!hideDetailLink && (
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <Link
                        href={detailHref}
                        className="hover:underline font-medium"
                        style={{ color: 'var(--ds-accent)' }}
                      >
                        상세 →
                      </Link>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {displayTransactions.length === 0 && (
        <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg text-center mt-4">
          <p>현재 필터 조건에 해당하는 결과가 없습니다.</p>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-md mt-4">
          <div className="flex-1 flex justify-between sm:justify-end gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <div className="hidden sm:flex gap-1 items-center">
              {getPageWindow(currentPage, totalPages).map((page, i) =>
                page === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-gray-400 select-none">…</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-2 border border-gray-300 text-sm rounded-md ${
                      page === currentPage
                        ? ''
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    style={page === currentPage ? { background: 'var(--ds-accent)', borderColor: 'var(--ds-accent)', color: '#fff' } : undefined}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="px-6 py-3 text-white font-bold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-(--ds-accent) hover:opacity-80"
            style={{ background: 'var(--ds-accent)' }}
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
      className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider${right ? ' text-right' : ' text-left'}${onClick ? ' cursor-pointer hover:text-gray-700' : ''}`}
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
        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-(--ds-accent) focus:border-(--ds-accent) text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function DealTypeBadge({ dealType }: { dealType?: string }) {
  if (!dealType || dealType === '매매') return null;
  const isNew = dealType === '신규분양권';
  return (
    <span
      className={`ml-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none ${
        isNew ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
      }`}
    >
      {isNew ? '분양권' : '입주권'}
    </span>
  );
}

export default TransactionList;
