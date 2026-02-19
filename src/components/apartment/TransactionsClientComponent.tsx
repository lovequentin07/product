"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NormalizedTransaction } from '@/types/real-estate';
import TransactionList from '@/components/apartment/TransactionList';

export default function TransactionsClientComponent({
  transactions,
  totalCount,
  currentPage,
  itemsPerPage,
  isLoading,
  error,
}: {
  transactions: NormalizedTransaction[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  isLoading: boolean;
  error: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('pageNo', String(newPage));
    // Preserve numOfRows if it exists, otherwise it will default
    if (searchParams.has('numOfRows')) {
      current.set('numOfRows', searchParams.get('numOfRows') as string);
    }
    router.push(`?${current.toString()}`);
  };

  const handleLoadMore = () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    const newNumOfRows = itemsPerPage + 100; // Load 100 more items
    current.set('numOfRows', String(newNumOfRows));
    current.set('pageNo', '1'); // Reset page to 1 when loading more rows
    router.push(`?${current.toString()}`);
  };

  return (
    <TransactionList
      transactions={transactions}
      totalCount={totalCount}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      isLoading={isLoading}
      error={error}
      onPageChange={handlePageChange}
      onLoadMore={handleLoadMore}
    />
  );
}
