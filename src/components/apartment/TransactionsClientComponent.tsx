"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { NormalizedTransaction } from '@/types/real-estate';
import TransactionList from '@/components/apartment/TransactionList';

export default function TransactionsClientComponent({
  transactions, // These are the transactions fetched from API for current page(s)
  totalCount,   // Original total count from API
  currentPage,
  itemsPerPage,
  isLoading,
  error,
  searchTerm, // searchTerm from URL
}: {
  transactions: NormalizedTransaction[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local state for immediate input feedback
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Sync local state with URL prop when prop changes (e.g., page navigation, new search)
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // Debounce effect for updating URL
  useEffect(() => {
    const handler = setTimeout(() => {
      // Only update URL if localSearchTerm is different from URL's searchTerm
      if (localSearchTerm !== searchTerm) {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        if (localSearchTerm) {
          current.set('searchTerm', localSearchTerm);
        } else {
          current.delete('searchTerm');
        }
        current.set('pageNo', '1'); // Reset page to 1 on search term change
        router.push(`?${current.toString()}`);
      }
    }, 300); // Debounce for 300ms

    return () => {
      clearTimeout(handler);
    };
  }, [localSearchTerm, searchTerm, router, searchParams]);


  const handlePageChange = (newPage: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('pageNo', String(newPage));
    if (searchParams.has('numOfRows')) {
      current.set('numOfRows', searchParams.get('numOfRows') as string);
    }
    // Preserve localSearchTerm when navigating pages
    if (localSearchTerm) {
      current.set('searchTerm', localSearchTerm);
    } else {
      current.delete('searchTerm');
    }
    router.push(`?${current.toString()}`);
  };

  const handleLoadMore = () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    const newNumOfRows = itemsPerPage + 15;
    current.set('numOfRows', String(newNumOfRows));
    current.set('pageNo', '1'); // Reset page to 1 when loading more rows
    // Preserve localSearchTerm when loading more
    if (localSearchTerm) {
      current.set('searchTerm', localSearchTerm);
    } else {
      current.delete('searchTerm');
    }
    router.push(`?${current.toString()}`);
  };

  // Filter transactions based on localSearchTerm for immediate feedback
  const clientFilteredTransactions = useMemo(() => {
    if (!localSearchTerm) {
      return transactions;
    }
    const lowerCaseSearchTerm = localSearchTerm.toLowerCase();
    return transactions.filter(transaction =>
      transaction.aptName.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [transactions, localSearchTerm]);


  return (
    <TransactionList
      transactions={clientFilteredTransactions} // Pass the client-filtered data
      totalCount={totalCount}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      isLoading={isLoading}
      error={error}
      onPageChange={handlePageChange}
      onLoadMore={handleLoadMore}
      searchTerm={localSearchTerm} // Pass localSearchTerm to TransactionList
      onSearchTermChange={setLocalSearchTerm} // Pass setter for localSearchTerm
    />
  );
}
