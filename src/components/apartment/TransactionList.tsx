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
  console.log('TransactionList: Received transactions prop:', JSON.stringify(transactions, null, 2));
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
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg max-w-4xl mx-auto my-4">
        <p className="font-bold">오류 발생:</p>
        <p>{error}</p>
        <p className="text-sm mt-2">API 키 확인 또는 요청 정보를 다시 확인해주세요.</p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-lg max-w-4xl mx-auto my-4">
        <p>선택하신 조건에 해당하는 아파트 실거래가 정보가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto my-4">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="bg-white shadow-md rounded-lg p-4 transition-transform transform hover:scale-105">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">{transaction.aptName}</h3>
          <p className="text-2xl font-bold text-blue-600 mb-3">{transaction.price.toLocaleString()}만원</p>
          <div className="text-gray-700 text-sm">
            <p><strong>거래일:</strong> {transaction.date}</p>
            <p><strong>전용면적:</strong> {transaction.area}㎡</p>
            <p><strong>층수:</strong> {transaction.floor}층</p>
            <p><strong>주소:</strong> {transaction.address}</p>
            <p><strong>건축년도:</strong> {transaction.buildYear}</p>
            {transaction.isCancelled && (
              <p className="text-red-500 font-medium mt-1">
                <span role="img" aria-label="cancelled">❌</span> 계약 해제됨
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;
