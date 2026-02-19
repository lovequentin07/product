// src/components/apartment/TransactionList.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { NormalizedTransaction } from '@/types/real-estate';

type SortField = keyof NormalizedTransaction;
type SortDirection = 'asc' | 'desc';

interface TransactionListProps {
  transactions: NormalizedTransaction[];
  isLoading: boolean;
  error: string | null;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, isLoading, error }) => {
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
    const sortableTransactions = [...transactions]; // Create a shallow copy to avoid mutating prop

    sortableTransactions.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      // Handle numbers
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      // Handle strings (including dates as strings)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      // Fallback for other types or mixed types
      return 0;
    });
    return sortableTransactions;
  }, [transactions, sortField, sortDirection]);


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
    <div className="overflow-x-auto max-w-6xl mx-auto my-4 bg-white shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('aptName')}>아파트명 {getSortIndicator('aptName')}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('date')}>거래일 {getSortIndicator('date')}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('price')}>거래금액 (만원) {getSortIndicator('price')}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('area')}>전용면적 (㎡) {getSortIndicator('area')}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('floor')}>층수 {getSortIndicator('floor')}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('address')}>주소 {getSortIndicator('address')}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('buildYear')}>건축년도 {getSortIndicator('buildYear')}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedTransactions.map((transaction) => ( // Use sortedTransactions here
            <tr key={transaction.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.aptName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.date}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">{transaction.price.toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.area}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.floor}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.address}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.buildYear}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {transaction.isCancelled && (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    계약 해제
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionList;
