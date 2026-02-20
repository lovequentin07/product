"use client";

import React, { useState } from 'react';
import { TransactionRow } from '@/lib/db/types';

interface Props {
  transactions: TransactionRow[];
  title?: string;
}

type SortKey = 'deal_date' | 'deal_amount_billion' | 'price_per_pyeong' | 'area_pyeong' | 'floor';

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
              {(
                [
                  ['deal_date', '거래일'],
                  ['deal_amount_billion', '가격(억)'],
                  ['price_per_pyeong', '평당(억)'],
                  ['area_pyeong', '면적(평)'],
                  ['floor', '층'],
                ] as [SortKey, string][]
              ).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {label}{ind(key)}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                상태
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {sorted.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">{t.deal_date}</td>
                <td className="px-4 py-3 whitespace-nowrap font-semibold text-blue-600 dark:text-blue-400">
                  {t.deal_amount_billion.toFixed(1)}억
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-bold text-red-600 dark:text-red-400">
                  {t.price_per_pyeong.toFixed(1)}억
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">{t.area_pyeong}평</td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-400">{t.floor}층</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {t.cdeal_type && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                      해제
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AptTransactionList;
