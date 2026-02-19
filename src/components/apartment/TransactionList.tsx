// src/components/apartment/TransactionList.tsx
"use client";

import React from 'react';
import { NormalizedTransaction } from '@/types/real-estate';

interface TransactionListProps {
  transactions: NormalizedTransaction[];
  isLoading: boolean;
  error: string | null;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, isLoading, error }) => {
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

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg max-w-6xl mx-auto my-4">
        <p>선택하신 조건에 해당하는 아파트 실거래가 정보가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto max-w-6xl mx-auto my-4 bg-white shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">아파트명</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">거래일</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">거래금액 (만원)</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전용면적 (㎡)</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">층수</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주소</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">건축년도</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
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
