"use client";

import React, { useState } from 'react';
import { TransactionRow } from '@/lib/db/types';

interface Props {
  transactions: TransactionRow[];
  title?: string;
}

type SortKey = 'deal_date' | 'deal_amount_billion' | 'price_per_pyeong' | 'area_pyeong' | 'floor' | 'build_year';

const COLUMNS: { key: SortKey; label: string; right?: boolean }[] = [
  { key: 'deal_date', label: '거래일' },
  { key: 'deal_amount_billion', label: '가격(억)', right: true },
  { key: 'price_per_pyeong', label: '평당(억)', right: true },
  { key: 'area_pyeong', label: '면적(평)', right: true },
  { key: 'floor', label: '층', right: true },
  { key: 'build_year', label: '건축년도', right: true },
];

const AptTransactionList: React.FC<Props> = ({ transactions, title = '전체 거래 이력' }) => {
  const [sortKey, setSortKey] = useState<SortKey>('deal_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...transactions].sort((a, b) => {
    const av = a[sortKey] as number | string;
    const bv = b[sortKey] as number | string;
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const ind = (k: SortKey) => (sortKey === k ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '');

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <p className="text-gray-500 dark:text-gray-400 text-center py-8">거래 이력이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-5">
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
        {title} <span className="text-gray-400 font-normal text-sm">({transactions.length}건)</span>
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              {COLUMNS.map(({ key, label, right }) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200${right ? ' text-right' : ' text-left'}`}
                >
                  {label}{ind(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sorted.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">{t.deal_date}</td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold text-blue-600 dark:text-blue-400 text-right">
                  {t.deal_amount_billion.toFixed(1)}억
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-bold text-red-600 dark:text-red-400 text-right">
                  {t.price_per_pyeong.toFixed(1)}억
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400 text-right">{t.area_pyeong}평</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400 text-right">{t.floor}층</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400 text-right">{t.build_year}년</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AptTransactionList;
