"use client";

import React, { useState, useMemo } from 'react';
import { NormalizedTransaction } from '@/types/real-estate';

type SortField = keyof NormalizedTransaction | 'pricePerPyeong';
type SortDirection = 'asc' | 'desc';

interface TransactionListProps {
  transactions: NormalizedTransaction[];
  isLoading: boolean;
  error: string | null;
  // Pagination props
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onLoadMore: () => void;
  // Search props
  searchTerm: string; // New: Receive searchTerm as prop
  onSearchTermChange: (term: string) => void; // New: Receive callback as prop
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
  searchTerm, // Destructure searchTerm from props
  onSearchTermChange, // Destructure onSearchTermChange from props
}) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to descending for new sort field
    }
  };

  const sortedTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }
    const sortableTransactions = [...transactions];

    sortableTransactions.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'pricePerPyeong') {
        const aAreaInPyeong = a.area * 0.3025;
        const bAreaInPyeong = b.area * 0.3025;
        aValue = aAreaInPyeong > 0 ? a.price / aAreaInPyeong : 0;
        bValue = bAreaInPyeong > 0 ? b.price / bAreaInPyeong : 0;
      } else {
        aValue = a[sortField as keyof NormalizedTransaction];
        bValue = b[sortField as keyof NormalizedTransaction];
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      return 0;
    });
    return sortableTransactions;
  }, [transactions, sortField, sortDirection]);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) {
      return sortedTransactions;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return sortedTransactions.filter(transaction =>
      transaction.aptName.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [sortedTransactions, searchTerm]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40 text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <p className="ml-3 text-lg">데이터 로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-6xl mx-auto my-4">
        <p className="font-bold">오류 발생:</p>
        <p>{error}</p>
        <p className="text-sm mt-2">API 키 확인 또는 요청 정보를 다시 확인해주세요.</p>
      </div>
    );
  }

  // Calculate pagination details
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Determine if 'Load More' button should be shown
  const canLoadMore = (currentPage * itemsPerPage) < totalCount;


  if (!transactions || transactions.length === 0) { // Check original transactions for empty state
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg max-w-6xl mx-auto my-4">
        <p>선택하신 조건에 해당하는 아파트 실거래가 정보가 없습니다.</p>
      </div>
    );
  }

  const getSortIndicator = (field: SortField) => {
    if (sortField === field) {
      return sortDirection === 'asc' ? ' ▲' : ' ▼';
    }
    return '';
  };

  return (
    <div className="max-w-6xl mx-auto my-4">
      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="아파트명으로 검색..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={searchTerm || ''}
          onChange={(e) => onSearchTermChange(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        {/* Added responsive-table class. Removed comments inside table tag to prevent hydration error */}
        <table className="min-w-full divide-y divide-gray-200 responsive-table">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('aptName')}>아파트명 {getSortIndicator('aptName')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('date')}>거래일 {getSortIndicator('date')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('price')}>거래금액 (만원) {getSortIndicator('price')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('pricePerPyeong')}>평당 금액 {getSortIndicator('pricePerPyeong')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('area')}>전용면적 (㎡) {getSortIndicator('area')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('floor')}>층수 {getSortIndicator('floor')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('address')}>주소 {getSortIndicator('address')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('buildYear')}>건축년도 {getSortIndicator('buildYear')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => {
              const areaInPyeong = transaction.area * 0.3025;
              const pricePerPyeong = areaInPyeong > 0 ? transaction.price / areaInPyeong : 0;
              return (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600" data-label="아파트명" onClick={() => onSearchTermChange(transaction.aptName)}>{transaction.aptName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="거래일">{transaction.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold" data-label="거래금액">{(transaction.price / 10000).toFixed(1)}억</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="평당 금액">{Math.round(pricePerPyeong).toLocaleString()}만원</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="전용면적">{Math.round(transaction.area * 0.3025)}평</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="층수">{transaction.floor}층</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="주소">{transaction.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" data-label="건축년도">{transaction.buildYear}년</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" data-label="상태">
                    {transaction.isCancelled && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        계약 해제
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* CSS for .responsive-table should be handled in globals.css */}
      {filteredTransactions.length === 0 && searchTerm && (
        <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg max-w-6xl mx-auto my-4 text-center">
          <p>'{searchTerm}'에 해당하는 검색 결과가 없습니다.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-md mt-4">
          <div className="flex-1 flex justify-between sm:justify-end">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <div className="hidden sm:flex ml-3">
              {pageNumbers.map(page => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    page === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </nav>
      )}

      {/* Load More Button */}
      {canLoadMore && (
        <div className="text-center mt-4">
          <button
            onClick={onLoadMore}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            더보기 ({totalCount - (currentPage * itemsPerPage)}개 남음)
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionList;