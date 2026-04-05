'use client';
// src/components/apt-mgmt/AptMgmtCompareSection.tsx
// 공용/개인관리비 토글 + 장기수선충당금 MainRow

import { useState } from 'react';
import { MgmtFeeResult } from '@apt-mgmt/types/management-fee';

interface Props {
  result: MgmtFeeResult;
  avgLabel: string;
  activeAvgTotal: number | null;
  activeAvgCommon: number | null;
  activeAvgPersonal: number | null;
  activeAvgSecurity: number | null;
  activeAvgCleaning: number | null;
  activeAvgHeating: number | null;
  activeAvgElectricity: number | null;
  activeAvgWater: number | null;
  activeAvgLtm: number | null;
  activeAvgLabor: number | null;
  activeAvgElevator: number | null;
  activeAvgRepair: number | null;
  activeAvgTrustMgmt: number | null;
  activeAvgHotWater: number | null;
  activeAvgGas: number | null;
  activeAvgOffice: number | null;
  activeAvgTax: number | null;
  activeAvgClothing: number | null;
  activeAvgTraining: number | null;
  activeAvgVehicle: number | null;
  activeAvgOtherOverhead: number | null;
  activeAvgDisinfection: number | null;
  activeAvgNetwork: number | null;
  activeAvgFacility: number | null;
  activeAvgSafety: number | null;
  activeAvgDisaster: number | null;
  activeAvgTv: number | null;
  activeAvgSewage: number | null;
  activeAvgWaste: number | null;
  activeAvgTenantRep: number | null;
  activeAvgInsurance: number | null;
  activeAvgElection: number | null;
  activeAvgOtherIndiv: number | null;
}

function fmt(n: number | null): string {
  if (n == null) return '-';
  return `${Math.round(n).toLocaleString()}원`;
}

function perHh(total: number, hh: number | null): number | null {
  if (!hh || hh <= 0) return null;
  return Math.round(total / hh);
}

/** 우리 단지와 평균 비교: 초과 여부 판단 */
function isOver(amount: number | null, avg: number | null): boolean {
  if (amount == null || avg == null || avg === 0) return false;
  return amount > avg * 1.1;
}

function SubRow({
  label,
  amount,
  avg = null,
}: {
  label: string;
  amount: number | null;
  avg?: number | null;
}) {
  const over = isOver(amount, avg);
  return (
    <div className="grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-x-3 py-2 border-b last:border-0"
      style={{ borderColor: 'var(--ds-cream-border)' }}
    >
      <span className="text-xs pl-6" style={{ color: 'var(--ds-ink-muted)' }}>{label}</span>
      <span
        className="text-xs text-right whitespace-nowrap font-medium"
        style={{ color: over ? '#b91c1c' : 'var(--ds-ink)' }}
      >
        {fmt(amount)}
        {over && <span className="ml-0.5 text-[10px]">▲</span>}
      </span>
      <span className="text-xs text-right whitespace-nowrap" style={{ color: 'var(--ds-ink-faint)' }}>
        {avg != null ? fmt(avg) : '-'}
      </span>
    </div>
  );
}

function MainRow({
  label,
  amount,
  avg,
  toggle,
  open,
}: {
  label: string;
  amount: number | null;
  avg: number | null;
  toggle?: () => void;
  open?: boolean;
}) {
  const over = isOver(amount, avg);
  return (
    <div
      className={`grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-x-3 py-3 border-b ${toggle ? 'cursor-pointer select-none' : ''}`}
      style={{ borderColor: 'var(--ds-cream-border)' }}
      onClick={toggle}
    >
      <span className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--ds-ink)' }}>
        {label}
        {toggle && (
          <span style={{ color: 'var(--ds-ink-faint)', fontSize: '11px' }}>
            {open ? '▾' : '▸'}
          </span>
        )}
      </span>
      <span
        className="text-sm font-bold text-right whitespace-nowrap"
        style={{ color: over ? '#b91c1c' : 'var(--ds-ink)' }}
      >
        {fmt(amount)}
        {over && <span className="ml-0.5 text-xs">▲</span>}
      </span>
      <span className="text-xs text-right whitespace-nowrap" style={{ color: 'var(--ds-ink-faint)' }}>
        {fmt(avg)}
      </span>
    </div>
  );
}

export default function AptMgmtCompareSection({
  result, avgLabel, activeAvgTotal, activeAvgCommon, activeAvgPersonal,
  activeAvgSecurity, activeAvgCleaning, activeAvgHeating, activeAvgElectricity,
  activeAvgWater, activeAvgLtm,
  activeAvgLabor, activeAvgElevator, activeAvgRepair, activeAvgTrustMgmt,
  activeAvgHotWater, activeAvgGas,
  activeAvgOffice, activeAvgTax, activeAvgClothing, activeAvgTraining,
  activeAvgVehicle, activeAvgOtherOverhead, activeAvgDisinfection, activeAvgNetwork,
  activeAvgFacility, activeAvgSafety, activeAvgDisaster, activeAvgTv,
  activeAvgSewage, activeAvgWaste, activeAvgTenantRep, activeAvgInsurance,
  activeAvgElection, activeAvgOtherIndiv,
}: Props) {
  const [commonOpen, setCommonOpen] = useState(true);
  const [personalOpen, setPersonalOpen] = useState(false);

  const hh = result.household_cnt;
  const personalFee = (result.total_per_hh != null && result.common_per_hh != null)
    ? result.total_per_hh - result.common_per_hh
    : null;

  return (
    <div
      className="rounded-2xl px-5 py-5"
      style={{ background: 'var(--ds-cream-card)', border: '1px solid var(--ds-cream-border)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--ds-ink-faint)' }}>
        주요 항목 비교
      </p>
      <div
        className="grid grid-cols-[1fr_5.5rem_5.5rem] gap-x-3 pb-2 mb-1 border-b"
        style={{ borderColor: 'var(--ds-cream-border)' }}
      >
        <span className="text-xs" style={{ color: 'var(--ds-ink-faint)' }}>항목</span>
        <span className="text-xs text-right" style={{ color: 'var(--ds-ink-faint)' }}>우리 단지</span>
        <span className="text-xs text-right" style={{ color: 'var(--ds-ink-faint)' }}>{avgLabel}</span>
      </div>

      <MainRow label="총 관리비" amount={result.total_per_hh} avg={activeAvgTotal} />

      <MainRow
        label="공용관리비"
        amount={result.common_per_hh}
        avg={activeAvgCommon}
        toggle={() => setCommonOpen(o => !o)}
        open={commonOpen}
      />
      {commonOpen && (
        <>
          <SubRow label="인건비"           amount={perHh(result.labor_cost, hh)}        avg={activeAvgLabor} />
          <SubRow label="제사무비"         amount={perHh(result.office_cost, hh)}        avg={activeAvgOffice} />
          <SubRow label="세금공과금"       amount={perHh(result.tax_fee, hh)}            avg={activeAvgTax} />
          <SubRow label="피복비"           amount={perHh(result.clothing_cost, hh)}      avg={activeAvgClothing} />
          <SubRow label="교육훈련비"       amount={perHh(result.training_cost, hh)}      avg={activeAvgTraining} />
          <SubRow label="차량유지비"       amount={perHh(result.vehicle_cost, hh)}       avg={activeAvgVehicle} />
          <SubRow label="기타일반관리비"   amount={perHh(result.other_overhead, hh)}     avg={activeAvgOtherOverhead} />
          <SubRow label="청소비"           amount={result.cleaning_per_hh}               avg={activeAvgCleaning} />
          <SubRow label="경비비"           amount={result.security_per_hh}               avg={activeAvgSecurity} />
          <SubRow label="소독비"           amount={perHh(result.disinfection_cost, hh)}  avg={activeAvgDisinfection} />
          <SubRow label="승강기유지비"     amount={perHh(result.elevator_cost, hh)}      avg={activeAvgElevator} />
          <SubRow label="지능형홈네트워크" amount={perHh(result.network_cost, hh)}       avg={activeAvgNetwork} />
          <SubRow label="수선비"           amount={perHh(result.repair_cost, hh)}        avg={activeAvgRepair} />
          <SubRow label="시설유지비"       amount={perHh(result.facility_cost, hh)}      avg={activeAvgFacility} />
          <SubRow label="안전점검비"       amount={perHh(result.safety_cost, hh)}        avg={activeAvgSafety} />
          <SubRow label="재해대비비"       amount={perHh(result.disaster_cost, hh)}      avg={activeAvgDisaster} />
          <SubRow label="위탁관리수수료"   amount={perHh(result.trust_mgmt_fee, hh)}     avg={activeAvgTrustMgmt} />
        </>
      )}

      <MainRow
        label="개인관리비"
        amount={personalFee}
        avg={activeAvgPersonal}
        toggle={() => setPersonalOpen(o => !o)}
        open={personalOpen}
      />
      {personalOpen && (
        <>
          <SubRow label="난방비"           amount={result.heating_per_hh}                                         avg={activeAvgHeating} />
          <SubRow label="급탕비"           amount={perHh(result.hot_water_common + result.hot_water_indiv, hh)}   avg={activeAvgHotWater} />
          <SubRow label="가스비"           amount={perHh(result.gas_common + result.gas_indiv, hh)}               avg={activeAvgGas} />
          <SubRow label="전기료"           amount={result.electricity_per_hh}                                     avg={activeAvgElectricity} />
          <SubRow label="수도료"           amount={result.water_per_hh}                                           avg={activeAvgWater} />
          <SubRow label="TV수신료"         amount={perHh(result.tv_fee, hh)}                                      avg={activeAvgTv} />
          <SubRow label="하수도료"         amount={perHh(result.sewage_fee, hh)}                                  avg={activeAvgSewage} />
          <SubRow label="생활폐기물수수료" amount={perHh(result.waste_fee, hh)}                                   avg={activeAvgWaste} />
          <SubRow label="입주자대표운영비" amount={perHh(result.tenant_rep_cost, hh)}                             avg={activeAvgTenantRep} />
          <SubRow label="화재보험료"       amount={perHh(result.insurance_cost, hh)}                              avg={activeAvgInsurance} />
          <SubRow label="선거관리비"       amount={perHh(result.election_cost, hh)}                               avg={activeAvgElection} />
          <SubRow label="기타"             amount={perHh(result.other_indiv, hh)}                                 avg={activeAvgOtherIndiv} />
        </>
      )}

      <MainRow label="장기수선충당금" amount={result.ltm_per_hh} avg={activeAvgLtm} />
    </div>
  );
}
