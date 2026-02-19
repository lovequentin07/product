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
  searchTerm, // New: searchTerm prop
}: {
  transactions: NormalizedTransaction[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  isLoading: boolean;
  error: string | null;
  searchTerm: string; // New: searchTerm prop type
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('pageNo', String(newPage));
    if (current.has('numOfRows')) { // Preserve numOfRows
      current.set('numOfRows', searchParams.get('numOfRows') as string);
    }
    if (current.has('searchTerm')) { // Preserve searchTerm
      current.set('searchTerm', searchParams.get('searchTerm') as string);
    }
    router.push(`?${current.toString()}`);
  };

  const handleLoadMore = () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    const newNumOfRows = itemsPerPage + 15; // Load 15 more items
    current.set('numOfRows', String(newNumOfRows));
    current.set('pageNo', '1'); // Reset page to 1 when loading more rows
    if (current.has('searchTerm')) { // Preserve searchTerm
      current.set('searchTerm', searchParams.get('searchTerm') as string);
    }
    router.push(`?${current.toString()}`);
  };

  const handleSearchTermChange = (term: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    if (term) {
      current.set('searchTerm', term);
    } else {
      current.delete('searchTerm');
    }
    current.set('pageNo', '1'); // Reset page to 1 on new search term
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
      searchTerm={searchTerm} // Pass searchTerm
      onSearchTermChange={handleSearchTermChange} // Pass callback
    />
  );
}
