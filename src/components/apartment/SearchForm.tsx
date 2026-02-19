// src/components/apartment/SearchForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getParentRegions, getRegionsByParent, getRegionNameByCode } from '@/data/regions';

const SearchForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedSi, setSelectedSi] = useState<string>('');
  const [selectedGu, setSelectedGu] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(() => new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>(() => (new Date().getMonth() + 1).toString().padStart(2, '0'));
  
  const parentRegions = getParentRegions();
  const subRegions = selectedSi ? getRegionsByParent(getRegionNameByCode(selectedSi) || '') : [];

  useEffect(() => {
    // URL 쿼리 파라미터로부터 초기 상태 설정
    const lawdCd = searchParams.get('lawdCd');
    const dealYmd = searchParams.get('dealYmd');

    if (lawdCd) {
      const siCode = lawdCd.substring(0, 2) + '000';
      const si = parentRegions.find(r => r.code === siCode);
      if (si) {
        setSelectedSi(si.code);
        setSelectedGu(lawdCd);
      }
    } else {
        // 기본값: 서울특별시 종로구
        const defaultSi = parentRegions.find(region => region.name === '서울특별시');
        if (defaultSi) {
          setSelectedSi(defaultSi.code);
          const defaultGu = getRegionsByParent(defaultSi.name).find(region => region.name === '종로구');
          if (defaultGu) {
            setSelectedGu(defaultGu.code);
          }
        }
    }
    
    if (dealYmd) {
      setSelectedYear(dealYmd.substring(0, 4));
      setSelectedMonth(dealYmd.substring(4, 6));
    }
  }, [searchParams]);

  const handleSearch = () => {
    if (selectedGu && selectedYear && selectedMonth) {
      const dealYmd = `${selectedYear}${selectedMonth}`;
      // 페이지를 리로드하여 서버 컴포넌트에서 데이터를 다시 가져오도록 URL 변경
      // 새 검색 시 pageNo를 1로 재설정
      router.push(`/real-estate/transaction?lawdCd=${selectedGu}&dealYmd=${dealYmd}&pageNo=1`);
    } else {
      alert('지역과 연월을 모두 선택해주세요.');
    }
  };

  const years = Array.from({ length: 20 }, (_, i) => (new Date().getFullYear() - i).toString()); // 지난 20년
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  return (
    <div className="p-4 bg-white shadow-md rounded-lg mb-6 max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* 시/도 선택 */}
        <div>
          <label htmlFor="si-select" className="block text-sm font-medium text-gray-700 mb-1">시/도</label>
          <select
            id="si-select"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            value={selectedSi}
            onChange={(e) => {
              setSelectedSi(e.target.value);
              setSelectedGu('');
            }}
          >
            <option value="">시/도 선택</option>
            {parentRegions.map((region) => (
              <option key={region.code} value={region.code}>{region.name}</option>
            ))}
          </select>
        </div>

        {/* 시/군/구 선택 */}
        <div>
          <label htmlFor="gu-select" className="block text-sm font-medium text-gray-700 mb-1">시/군/구</label>
          <select
            id="gu-select"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            value={selectedGu}
            onChange={(e) => setSelectedGu(e.target.value)}
            disabled={!selectedSi}
          >
            <option value="">시/군/구 선택</option>
            {subRegions.map((region) => (
              <option key={region.code} value={region.code}>{region.name}</option>
            ))}
          </select>
        </div>

        {/* 연도 및 월 선택 */}
        <div className="flex space-x-2">
          <div className="flex-1">
            <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-1">년도</label>
            <select
              id="year-select"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {years.map((year) => <option key={year} value={year}>{year}년</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">월</label>
            <select
              id="month-select"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {months.map((month) => <option key={month} value={month}>{month}월</option>)}
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={handleSearch}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        disabled={!selectedGu || !selectedYear || !selectedMonth}
      >
        아파트 실거래가 조회
      </button>
    </div>
  );
};

export default SearchForm;