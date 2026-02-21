'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import TransactionList from '@/components/apartment/TransactionList';
import { NormalizedTransaction } from '@/types/real-estate';

interface Props {
  transactions: NormalizedTransaction[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  sortBy: string;
  sortDir: 'asc' | 'desc';
  sggCd: string;
}

export default function AptDetailTransactionsClient({
  transactions,
  totalCount,
  currentPage,
  itemsPerPage,
  sortBy,
  sortDir,
  sggCd,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => params.set(k, v));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    updateUrl({ pageNo: String(page) });
  };

  const handleSortChange = (dbField: string) => {
    const newDir = sortBy === dbField && sortDir === 'desc' ? 'asc' : 'desc';
    updateUrl({ sortBy: dbField, sortDir: newDir, pageNo: '1' });
  };

  const handleLoadMore = () => {
    const params = new URLSearchParams(searchParams.toString());
    const current = parseInt(params.get('numOfRows') || String(itemsPerPage));
    params.set('numOfRows', String(current + 20));
    params.set('pageNo', '1');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <TransactionList
      transactions={transactions}
      isLoading={false}
      error={null}
      totalCount={totalCount}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      onPageChange={handlePageChange}
      onLoadMore={handleLoadMore}
      searchTerm=""
      onSearchTermChange={() => {}}
      sggCd={sggCd}
      sortBy={sortBy}
      sortDir={sortDir}
      onSortChange={handleSortChange}
      hideSearch={true}
      hideDetailLink={true}
    />
  );
}
