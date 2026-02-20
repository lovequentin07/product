"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRegionsByParent } from '@/data/regions';

const SEOUL_DISTRICTS = getRegionsByParent('서울특별시');
const ALL_SEOUL_CODE = '11000';

const SearchForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedGu, setSelectedGu] = useState<string>(ALL_SEOUL_CODE);
  const [selectedYear, setSelectedYear] = useState<string>(() => new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );

  useEffect(() => {
    const lawdCd = searchParams.get('lawdCd');
    const dealYmd = searchParams.get('dealYmd');

    setSelectedGu(lawdCd || ALL_SEOUL_CODE);

    if (dealYmd) {
      setSelectedYear(dealYmd.substring(0, 4));
      setSelectedMonth(dealYmd.substring(4, 6));
    }
  }, [searchParams]);

  const handleSearch = () => {
    const dealYmd = `${selectedYear}${selectedMonth}`;
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    const searchTerm = current.get('searchTerm') || '';

    let query = `/real-estate/transaction?lawdCd=${selectedGu}&dealYmd=${dealYmd}&pageNo=1`;
    if (searchTerm) query += `&searchTerm=${searchTerm}`;
    router.push(query);
  };

  const years = Array.from({ length: 20 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg mb-6 max-w-4xl mx-auto border border-transparent dark:border-gray-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* 시군구 선택 */}
        <div>
          <label htmlFor="gu-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            시군구
          </label>
          <select
            id="gu-select"
            value={selectedGu}
            onChange={(e) => setSelectedGu(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
          >
            <option value={ALL_SEOUL_CODE}>서울 전체</option>
            {SEOUL_DISTRICTS.map((region) => (
              <option key={region.code} value={region.code}>
                {region.name}
              </option>
            ))}
          </select>
        </div>

        {/* 연도·월 선택 */}
        <div className="flex space-x-2 md:col-span-2">
          <div className="flex-1">
            <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              년도
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              월
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            >
              {months.map((m) => (
                <option key={m} value={m}>{m}월</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={handleSearch}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
      >
        아파트 실거래가 조회
      </button>
    </div>
  );
};

export default SearchForm;
