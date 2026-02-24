'use client';
// src/components/apt-mgmt/AptMgmtComparisonTable.tsx
// 4컬럼 비교표: 항목 / 우리 아파트 / 구 평균 / 서울 평균

import { useState, Fragment } from 'react';
import { MgmtFeeResult } from '@/types/management-fee';

interface Props {
  result: MgmtFeeResult;
}

function formatWon(val: number | null | undefined): string {
  if (val == null || val === 0) return '-';
  return `${val.toLocaleString()}원`;
}

function cellColor(mine: number | null | undefined, avg: number | null | undefined): string {
  if (!mine || !avg || avg === 0) return '';
  const ratio = mine / avg;
  if (ratio > 1.1) return 'text-red-600 font-medium';
  if (ratio < 0.9) return 'text-green-600 font-medium';
  return '';
}

interface FeeItem {
  label: string;
  mine: number | null;
  sggAvg?: number | null;
  seoulAvg?: number | null;
  children?: FeeItem[];
}

export default function AptMgmtComparisonTable({ result }: Props) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  // 일반관리비 = 인건비+제사무비+제세공과금+피복비+교육훈련비+차량유지비+그밖부대비용
  const generalMgmt =
    result.labor_cost + result.office_cost + result.tax_fee +
    result.clothing_cost + result.training_cost + result.vehicle_cost + result.other_overhead;
  const generalMgmtPerHh = result.household_cnt ? Math.round(generalMgmt / result.household_cnt) : null;

  const rows: FeeItem[] = [
    {
      label: '공용관리비 합계',
      mine: result.common_per_hh,
      sggAvg: result.sgg_avg_common ? Math.round(result.sgg_avg_common) : null,
      seoulAvg: result.seoul_avg_common ? Math.round(result.seoul_avg_common) : null,
      children: [
        { label: '일반관리비', mine: generalMgmtPerHh },
        { label: '경비비', mine: result.security_per_hh, sggAvg: result.sgg_avg_security ? Math.round(result.sgg_avg_security) : null, seoulAvg: result.seoul_avg_security ? Math.round(result.seoul_avg_security) : null },
        { label: '청소비', mine: result.cleaning_per_hh },
        { label: '승강기유지비', mine: result.household_cnt ? Math.round(result.elevator_cost / result.household_cnt) : null },
        { label: '수선비', mine: result.household_cnt ? Math.round(result.repair_cost / result.household_cnt) : null },
        { label: '위탁관리수수료', mine: result.household_cnt ? Math.round(result.trust_mgmt_fee / result.household_cnt) : null },
      ],
    },
    {
      label: '난방비 (세대당)',
      mine: result.heating_per_hh,
      children: [
        { label: '난방비 (공용)', mine: result.household_cnt ? Math.round(result.heating_common / result.household_cnt) : null },
        { label: '난방비 (전용)', mine: result.household_cnt ? Math.round(result.heating_indiv / result.household_cnt) : null },
      ],
    },
    {
      label: '전기료 (세대당)',
      mine: result.electricity_per_hh,
      children: [
        { label: '전기료 (공용)', mine: result.household_cnt ? Math.round(result.electricity_common / result.household_cnt) : null },
        { label: '전기료 (전용)', mine: result.household_cnt ? Math.round(result.electricity_indiv / result.household_cnt) : null },
      ],
    },
    {
      label: '수도료 (세대당)',
      mine: result.water_per_hh,
      children: [
        { label: '수도료 (공용)', mine: result.household_cnt ? Math.round(result.water_common / result.household_cnt) : null },
        { label: '수도료 (전용)', mine: result.household_cnt ? Math.round(result.water_indiv / result.household_cnt) : null },
      ],
    },
    {
      label: '장기수선충당금 (세대당)',
      mine: result.ltm_per_hh,
      children: [
        { label: '월 부과액', mine: result.ltm_per_hh },
        { label: '적립률', mine: result.ltm_reserve_rate ? Math.round(result.ltm_reserve_rate) : null },
      ],
    },
    {
      label: '총 관리비 (세대당)',
      mine: result.total_per_hh,
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">관리비 세부 비교</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">세대당 월 평균 (원)</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400">
              <th className="text-left px-4 py-3 font-medium">항목</th>
              <th className="text-right px-4 py-3 font-medium">우리 아파트</th>
              <th className="text-right px-4 py-3 font-medium">{result.sgg_nm} 평균</th>
              <th className="text-right px-4 py-3 font-medium">서울 평균</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {rows.map((row) => {
              const isOpen = openGroups.has(row.label);
              const hasChildren = (row.children?.length ?? 0) > 0;
              return (
                <Fragment key={row.label}>
                  <tr
                    onClick={() => hasChildren && toggleGroup(row.label)}
                    className={hasChildren ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}
                  >
                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-200">
                      {hasChildren && (
                        <span className="mr-1 text-gray-400 dark:text-gray-500">{isOpen ? '▾' : '▸'}</span>
                      )}
                      {row.label}
                    </td>
                    <td className={`text-right px-4 py-3 ${cellColor(row.mine, row.sggAvg)}`}>
                      {formatWon(row.mine)}
                    </td>
                    <td className="text-right px-4 py-3 text-gray-500 dark:text-gray-400">
                      {row.sggAvg != null ? formatWon(row.sggAvg) : '-'}
                    </td>
                    <td className="text-right px-4 py-3 text-gray-500 dark:text-gray-400">
                      {row.seoulAvg != null ? formatWon(row.seoulAvg) : '-'}
                    </td>
                  </tr>
                  {isOpen && row.children?.map((child) => (
                    <tr key={child.label} className="bg-gray-50/50 dark:bg-gray-700/50">
                      <td className="px-4 py-2 pl-8 text-gray-500 dark:text-gray-400 text-xs">{child.label}</td>
                      <td className="text-right px-4 py-2 text-xs text-gray-600 dark:text-gray-300">
                        {formatWon(child.mine)}
                      </td>
                      <td className="text-right px-4 py-2 text-xs text-gray-400 dark:text-gray-500">
                        {child.sggAvg != null ? formatWon(child.sggAvg) : '-'}
                      </td>
                      <td className="text-right px-4 py-2 text-xs text-gray-400 dark:text-gray-500">
                        {child.seoulAvg != null ? formatWon(child.seoulAvg) : '-'}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700 text-xs text-gray-400 dark:text-gray-400">
        * 구 평균 및 서울 평균은 공용관리비 기준. 세대당 = 단지 전체 합계 ÷ 세대수.
      </div>
    </div>
  );
}
