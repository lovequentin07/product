import React, { useMemo } from 'react';
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
  searchTerm,
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

  const handlePageChange = (newPage: number) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('pageNo', String(newPage));
    if (searchParams.has('numOfRows')) {
      current.set('numOfRows', searchParams.get('numOfRows') as string);
    }
    if (searchTerm) { // Preserve searchTerm
      current.set('searchTerm', searchTerm);
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
    if (searchTerm) { // Preserve searchTerm
      current.set('searchTerm', searchTerm);
    } else {
      current.delete('searchTerm');
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

  // Filter transactions based on searchTerm before passing to TransactionList
  const clientFilteredTransactions = useMemo(() => {
    if (!searchTerm) {
      return transactions;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return transactions.filter(transaction =>
      transaction.aptName.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [transactions, searchTerm]);


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
      searchTerm={searchTerm}
      onSearchTermChange={handleSearchTermChange}
    />
  );
}
