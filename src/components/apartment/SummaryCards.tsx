"use client";

import React from 'react';
import { NormalizedTransaction } from '@/types/real-estate';

interface SummaryCardsProps {
  transactions: NormalizedTransaction[];
  totalCount: number;
}

function toBillion(manwon: number): string {
  return (manwon / 10000).toFixed(1);
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ transactions, totalCount }) => {
  if (transactions.length === 0) return null;

  const prices = transactions.map((t) => t.price);
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);

  const avgPricePerPyeong =
    transactions.reduce((sum, t) => {
      const pyeong = t.area * 0.3025;
      return sum + (pyeong > 0 ? t.price / pyeong : 0);
    }, 0) / transactions.length;

  const cards = [
    { label: '총 거래', value: `${totalCount}건`, sub: '해당 조건 전체', color: 'text-gray-800 dark:text-gray-100' },
    { label: '평균 거래가', value: `${toBillion(avgPrice)}억`, sub: '만원 기준', color: 'text-blue-600 dark:text-blue-400' },
    { label: '최고 거래가', value: `${toBillion(maxPrice)}억`, sub: '이번 달 최고', color: 'text-amber-600 dark:text-amber-400' },
    { label: '평균 평당가', value: `${toBillion(avgPricePerPyeong)}억`, sub: '평당 기준', color: 'text-amber-600 dark:text-amber-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-6xl mx-auto mb-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 px-4 py-3"
        >
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{card.label}</p>
          <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{card.sub}</p>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
