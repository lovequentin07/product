"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRegionsByParent } from '@/data/regions';

const SEOUL_DISTRICTS = getRegionsByParent('서울특별시');
const ALL_SEOUL_CODE = '11000';

const YEAR_ALL = 'all';
const MONTH_ALL = 'all';

const SearchForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedGu, setSelectedGu] = useState<string>(ALL_SEOUL_CODE);
  const [selectedYear, setSelectedYear] = useState<string>(() => new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    (new Date().getMonth() + 1).toString().padStart(2, '0')
  );

  // URL → 폼 상태 동기화
  useEffect(() => {
    const lawdCd = searchParams.get('lawdCd');
    const dealYmd = searchParams.get('dealYmd');

    setSelectedGu(lawdCd || ALL_SEOUL_CODE);

    if (!dealYmd) {
      // dealYmd 파라미터 없음 → 전체 기간
      setSelectedYear(YEAR_ALL);
      setSelectedMonth(MONTH_ALL);
    } else if (dealYmd.length === 6) {
      // YYYYMM
      setSelectedYear(dealYmd.substring(0, 4));
      setSelectedMonth(dealYmd.substring(4, 6));
    } else if (dealYmd.length === 4) {
      // YYYY (월 전체)
      setSelectedYear(dealYmd);
      setSelectedMonth(MONTH_ALL);
    }
  }, [searchParams]);

  const handleSearch = () => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    const searchTerm = current.get('searchTerm') || '';

    let query = `/apt?lawdCd=${selectedGu}&pageNo=1`;

    if (selectedYear !== YEAR_ALL) {
      if (selectedMonth !== MONTH_ALL) {
        query += `&dealYmd=${selectedYear}${selectedMonth}`;
      } else {
        query += `&dealYmd=${selectedYear}`;
      }
    }
    // selectedYear === YEAR_ALL → dealYmd 생략 (전체 기간)

    if (searchTerm) query += `&searchTerm=${searchTerm}`;
    router.push(query);
  };

  const isYearAll = selectedYear === YEAR_ALL;

  const years = Array.from({ length: 20 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  return (
    <div className="p-4 bg-white dark:bg-gray-800 shadow-md rounded-lg mb-6 max-w-6xl mx-auto border border-transparent dark:border-gray-700">
      <div className="px-4 md:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* 시군구 */}
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
              {SEOUL_DISTRICTS.map((r) => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </select>
          </div>

          {/* 연도 + 월 */}
          <div className="flex space-x-2 md:col-span-2">
            {/* 연도 */}
            <div className="flex-1">
              <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                년도
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  // 연도를 전체로 바꾸면 월도 전체로 자동 설정
                  if (e.target.value === YEAR_ALL) setSelectedMonth(MONTH_ALL);
                }}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
              >
                <option value={YEAR_ALL}>전체</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
            </div>

            {/* 월 — 연도가 전체이면 비활성화 */}
            <div className="flex-1">
              <label
                htmlFor="month-select"
                className={`block text-sm font-medium mb-1 ${
                  isYearAll ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                월
              </label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                disabled={isYearAll}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value={MONTH_ALL}>전체</option>
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
    </div>
  );
};

export default SearchForm;
