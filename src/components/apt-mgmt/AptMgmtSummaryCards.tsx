// src/components/apt-mgmt/AptMgmtSummaryCards.tsx

import { MgmtFeeResult } from '@/types/management-fee';
import { type Tier, tierConfig } from './summaryConfig';
import AptMgmtShareButtons from './AptMgmtShareButtons';
import AptMgmtCompareSection from './AptMgmtCompareSection';

function formatBillingYm(ym: string): string {
  if (!ym || ym.length < 6) return ym;
  return `${ym.slice(0, 4)}년 ${parseInt(ym.slice(4, 6), 10)}월`;
}

interface Props {
  result: MgmtFeeResult;
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

const ADVICE_THRESHOLD = 0.10;

function computeAdviceLine(
  commonVal: number | null,
  avgCommon: number | null,
  subItems: { label: string; val: number | null; avg: number | null }[],
  tier: Tier | null,
): string {
  // Case 1: 공용관리비 기준 이상 초과
  if (avgCommon && avgCommon > 0 && (commonVal ?? 0) > avgCommon * (1 + ADVICE_THRESHOLD)) {
    if (tier === 'D' || tier === 'E') {
      return '공용관리비 전반에 대해 입주자 대표회의에서 절감 방안을 논의해보세요.';
    }
    return '공용관리비 항목에 대해 입주자 대표회의에서 논의해보는 것이 좋아요.';
  }

  // Case 2: 세부 항목 중 기준 이상 초과 항목 탐색 (초과율 가장 큰 1개)
  const topItem = subItems
    .filter(({ val, avg }) => val != null && avg != null && avg > 0)
    .map(item => ({ label: item.label, ratio: ((item.val ?? 0) - (item.avg ?? 0)) / (item.avg ?? 1) }))
    .filter(item => item.ratio > ADVICE_THRESHOLD)
    .sort((a, b) => b.ratio - a.ratio)[0];

  if (topItem) {
    if (tier === 'D' || tier === 'E') {
      return `특히 ${topItem.label} 항목이 평균을 초과해요. 세부 내역을 우선 점검해보세요.`;
    }
    return `${topItem.label} 항목이 다소 높아요. 세부 내역을 확인해보는 것을 권장해요.`;
  }

  // Case 3: 모두 기준 미만 — 격려
  if (tier === 'A' || tier === 'B') {
    return '주요 항목이 모두 평균 이하예요. 현재 수준을 잘 유지하고 있어요.';
  }
  if (tier === 'D' || tier === 'E') {
    return '개인사용료(난방·전기·수도 등) 항목별 사용량도 점검해보세요.';
  }
  return '전반적으로 평균 수준으로 잘 유지되고 있어요.';
}

function toTier(rank: number | null, total: number | null): Tier | null {
  if (!rank || !total) return null;
  const pct = (rank / total) * 100;
  if (pct <= 20) return 'A';
  if (pct <= 40) return 'B';
  if (pct <= 60) return 'C';
  if (pct <= 80) return 'D';
  return 'E';
}

// 절약 점수: 높을수록 좋음 (fill 높으면 바 길게 = 직관적)
function rankScore(rank: number | null, total: number | null): number {
  if (!rank || !total) return 50;
  return Math.round(((total - rank + 1) / total) * 100);
}

// 점수에 따른 바 색상: 높으면 초록, 낮으면 빨강
function scoreColor(score: number): string {
  if (score >= 67) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-400';
  return 'bg-red-500';
}

interface BarRowProps {
  label: string;
  dotColor: string;
  score: number;  // 0~100 (높을수록 좋음)
}

function BarRow({ label, dotColor, score }: BarRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-[6.5rem] sm:w-28 shrink-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      </div>
      <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${scoreColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 w-12 text-right shrink-0">
        {score}점
      </span>
    </div>
  );
}


export default function AptMgmtSummaryCards({ result }: Props) {
  // 기준 결정: umd_total >= 5이면 동 기준, 아니면 구 기준 fallback
  const useUmd = (result.umd_total ?? 0) >= 5;
  const activeRank  = useUmd ? result.umd_rank  : result.sgg_rank;
  const activeTotal = useUmd ? result.umd_total : result.sgg_total;

  const tier = toTier(activeRank, activeTotal);
  const config = tier ? tierConfig[tier] : null;

  // 절약점수 (활성 기준)
  const score = rankScore(activeRank, activeTotal);
  const scoreLabel = `절약점수 ${score}점`;

  // 동 기준 percent (A/B: 상위, D/E: 하위)
  const isGood = tier === 'A' || tier === 'B' || tier === 'C';
  const umdPercent = activeTotal && activeRank
    ? isGood
      ? Math.round((activeRank / activeTotal) * 100)
      : Math.round(((activeTotal - activeRank) / activeTotal) * 100) + 1
    : null;

  // 구 기준 percent (fallback 텍스트용)
  const sggRank  = result.sgg_rank  ?? 0;
  const sggTotal = result.sgg_total ?? 0;
  const sggPercent = sggTotal > 0
    ? isGood
      ? Math.round((sggRank / sggTotal) * 100)
      : Math.round(((sggTotal - sggRank) / sggTotal) * 100) + 1
    : null;

  // 개인관리비 = 총 관리비 - 공용관리비
  const personalFee = (result.total_per_hh != null && result.common_per_hh != null)
    ? result.total_per_hh - result.common_per_hh
    : null;

  // 비교 기준 평균 (동 기준 우선, fallback 구 기준)
  const activeAvgTotal   = useUmd ? result.umd_avg_total   : result.sgg_avg_total;
  const activeAvgCommon  = useUmd ? result.umd_avg_common  : result.sgg_avg_common;
  const activeAvgPersonal = (activeAvgTotal != null && activeAvgCommon != null)
    ? activeAvgTotal - activeAvgCommon
    : null;
  const activeAvgSecurity    = useUmd ? result.umd_avg_security    : result.sgg_avg_security;
  const activeAvgCleaning    = useUmd ? result.umd_avg_cleaning    : result.sgg_avg_cleaning;
  const activeAvgHeating     = useUmd ? result.umd_avg_heating     : result.sgg_avg_heating;
  const activeAvgElectricity = useUmd ? result.umd_avg_electricity : result.sgg_avg_electricity;
  const activeAvgWater       = useUmd ? result.umd_avg_water       : result.sgg_avg_water;
  const activeAvgLtm         = useUmd ? result.umd_avg_ltm         : result.sgg_avg_ltm;
  const activeAvgLabor       = useUmd ? result.umd_avg_labor       : result.sgg_avg_labor;
  const activeAvgElevator    = useUmd ? result.umd_avg_elevator    : result.sgg_avg_elevator;
  const activeAvgRepair      = useUmd ? result.umd_avg_repair      : result.sgg_avg_repair;
  const activeAvgTrustMgmt   = useUmd ? result.umd_avg_trust_mgmt  : result.sgg_avg_trust_mgmt;
  const activeAvgHotWater    = useUmd ? result.umd_avg_hot_water   : result.sgg_avg_hot_water;
  const activeAvgGas         = useUmd ? result.umd_avg_gas         : result.sgg_avg_gas;
  const activeAvgOffice      = useUmd ? result.umd_avg_office      : result.sgg_avg_office;
  const activeAvgTax         = useUmd ? result.umd_avg_tax         : result.sgg_avg_tax;
  const activeAvgClothing    = useUmd ? result.umd_avg_clothing    : result.sgg_avg_clothing;
  const activeAvgTraining    = useUmd ? result.umd_avg_training    : result.sgg_avg_training;
  const activeAvgVehicle     = useUmd ? result.umd_avg_vehicle     : result.sgg_avg_vehicle;
  const activeAvgOtherOverhead = useUmd ? result.umd_avg_other_overhead : result.sgg_avg_other_overhead;
  const activeAvgDisinfection = useUmd ? result.umd_avg_disinfection : result.sgg_avg_disinfection;
  const activeAvgNetwork     = useUmd ? result.umd_avg_network     : result.sgg_avg_network;
  const activeAvgFacility    = useUmd ? result.umd_avg_facility    : result.sgg_avg_facility;
  const activeAvgSafety      = useUmd ? result.umd_avg_safety      : result.sgg_avg_safety;
  const activeAvgDisaster    = useUmd ? result.umd_avg_disaster    : result.sgg_avg_disaster;
  const activeAvgTv          = useUmd ? result.umd_avg_tv          : result.sgg_avg_tv;
  const activeAvgSewage      = useUmd ? result.umd_avg_sewage      : result.sgg_avg_sewage;
  const activeAvgWaste       = useUmd ? result.umd_avg_waste       : result.sgg_avg_waste;
  const activeAvgTenantRep   = useUmd ? result.umd_avg_tenant_rep  : result.sgg_avg_tenant_rep;
  const activeAvgInsurance   = useUmd ? result.umd_avg_insurance   : result.sgg_avg_insurance;
  const activeAvgElection    = useUmd ? result.umd_avg_election    : result.sgg_avg_election;
  const activeAvgOtherIndiv  = useUmd ? result.umd_avg_other_indiv : result.sgg_avg_other_indiv;
  const avgLabel = useUmd ? '동 평균' : '구 평균';

  // D/E tier: 공용/개인 중 평균 초과 폭이 큰 쪽을 문제 항목으로 표시
  const commonDiff   = (result.common_per_hh ?? 0) - (activeAvgCommon   ?? 0);
  const personalDiff = (personalFee          ?? 0) - (activeAvgPersonal ?? 0);
  const problemArea  = personalDiff >= commonDiff ? '개인관리비' : '공용관리비';

  // 동/구 기준에 따라 템플릿 선택
  const titleTemplate = useUmd ? config?.title         : config?.fallbackTitle;
  const descTemplate  = useUmd ? config?.desc          : config?.fallbackDesc;

  const templateVars = {
    apt_nm:       result.apt_nm,
    sgg_nm:       result.sgg_nm,
    umd_nm:       result.umd_nm ?? result.sgg_nm,
    umd_rank:     activeRank  ?? 0,
    umd_total:    activeTotal ?? 0,
    umd_percent:  umdPercent  ?? 0,
    rank:         sggRank,
    total_count:  sggTotal,
    percent:      sggPercent  ?? 0,
    problem_area: problemArea,
  };

  const title = titleTemplate
    ? interpolate(titleTemplate, templateVars)
    : result.apt_nm;

  const hh = result.household_cnt;
  const p = (cost: number): number | null => (hh && hh > 0 ? Math.round(cost / hh) : null);

  const adviceLine = computeAdviceLine(
    result.common_per_hh,
    activeAvgCommon,
    [
      // 공용관리비 세부 (17개)
      { label: '인건비',           val: p(result.labor_cost),                                         avg: activeAvgLabor },
      { label: '제사무비',         val: p(result.office_cost),                                        avg: activeAvgOffice },
      { label: '세금공과금',       val: p(result.tax_fee),                                            avg: activeAvgTax },
      { label: '피복비',           val: p(result.clothing_cost),                                      avg: activeAvgClothing },
      { label: '교육훈련비',       val: p(result.training_cost),                                      avg: activeAvgTraining },
      { label: '차량유지비',       val: p(result.vehicle_cost),                                       avg: activeAvgVehicle },
      { label: '기타일반관리비',   val: p(result.other_overhead),                                     avg: activeAvgOtherOverhead },
      { label: '청소비',           val: result.cleaning_per_hh,                                       avg: activeAvgCleaning },
      { label: '경비비',           val: result.security_per_hh,                                       avg: activeAvgSecurity },
      { label: '소독비',           val: p(result.disinfection_cost),                                  avg: activeAvgDisinfection },
      { label: '승강기유지비',     val: p(result.elevator_cost),                                      avg: activeAvgElevator },
      { label: '지능형홈네트워크', val: p(result.network_cost),                                       avg: activeAvgNetwork },
      { label: '수선비',           val: p(result.repair_cost),                                        avg: activeAvgRepair },
      { label: '시설유지비',       val: p(result.facility_cost),                                      avg: activeAvgFacility },
      { label: '안전점검비',       val: p(result.safety_cost),                                        avg: activeAvgSafety },
      { label: '재해대비비',       val: p(result.disaster_cost),                                      avg: activeAvgDisaster },
      { label: '위탁관리수수료',   val: p(result.trust_mgmt_fee),                                     avg: activeAvgTrustMgmt },
      // 개인관리비 세부 (12개)
      { label: '난방비',           val: result.heating_per_hh,                                        avg: activeAvgHeating },
      { label: '급탕비',           val: p(result.hot_water_common + result.hot_water_indiv),           avg: activeAvgHotWater },
      { label: '가스비',           val: p(result.gas_common + result.gas_indiv),                      avg: activeAvgGas },
      { label: '전기료',           val: result.electricity_per_hh,                                    avg: activeAvgElectricity },
      { label: '수도료',           val: result.water_per_hh,                                          avg: activeAvgWater },
      { label: 'TV수신료',         val: p(result.tv_fee),                                             avg: activeAvgTv },
      { label: '하수도료',         val: p(result.sewage_fee),                                         avg: activeAvgSewage },
      { label: '생활폐기물수수료', val: p(result.waste_fee),                                          avg: activeAvgWaste },
      { label: '입주자대표운영비', val: p(result.tenant_rep_cost),                                    avg: activeAvgTenantRep },
      { label: '화재보험료',       val: p(result.insurance_cost),                                     avg: activeAvgInsurance },
      { label: '선거관리비',       val: p(result.election_cost),                                      avg: activeAvgElection },
      { label: '기타',             val: p(result.other_indiv),                                        avg: activeAvgOtherIndiv },
      // 별도
      { label: '장기수선충당금',   val: result.ltm_per_hh,                                            avg: activeAvgLtm },
    ],
    tier,
  );

  const desc = descTemplate
    ? interpolate(descTemplate, templateVars) + '\n' + adviceLine
    : adviceLine;

  return (
    <div className="space-y-8 py-2">

      {/* 상단 헤더 */}
      <div className="text-center pb-4 border-b border-gray-100 dark:border-gray-700">
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100 break-words leading-tight">
          {result.apt_nm}
        </p>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
          관리비 분석 결과
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          {formatBillingYm(result.billing_ym)}
          {' | '}{useUmd ? (result.umd_nm ?? result.sgg_nm) : result.sgg_nm} 기준
          {result.household_cnt ? ` | ${result.household_cnt.toLocaleString()}세대` : ''}
        </p>
      </div>

      {/* 메인 결과 */}
      <div className="text-center space-y-4">
        <p className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${config?.color ?? 'text-gray-800 dark:text-gray-100'}`}>
          {scoreLabel}
        </p>
        <h3 className="text-lg sm:text-xl font-semibold leading-snug break-words text-gray-700 dark:text-gray-200">
          {title}
        </h3>
        {desc && (
          <div className="space-y-2 text-center">
            {desc.split('\n').map((line, i) => (
              <p key={i} className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* 바 차트 (동→구→서울) */}
      <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl px-5 py-6 space-y-4">
        <BarRow
          label="동네 절약점수"
          dotColor="bg-cyan-400"
          score={rankScore(result.umd_rank, result.umd_total)}
        />
        <BarRow
          label="구 절약점수"
          dotColor="bg-violet-400"
          score={rankScore(result.sgg_rank, result.sgg_total)}
        />
        <BarRow
          label="서울 절약점수"
          dotColor="bg-blue-400"
          score={rankScore(result.seoul_rank, result.seoul_total)}
        />
      </div>

      <AptMgmtCompareSection
        result={result}
        avgLabel={avgLabel}
        activeAvgTotal={activeAvgTotal}
        activeAvgCommon={activeAvgCommon}
        activeAvgPersonal={activeAvgPersonal}
        activeAvgSecurity={activeAvgSecurity}
        activeAvgCleaning={activeAvgCleaning}
        activeAvgHeating={activeAvgHeating}
        activeAvgElectricity={activeAvgElectricity}
        activeAvgWater={activeAvgWater}
        activeAvgLtm={activeAvgLtm}
        activeAvgLabor={activeAvgLabor}
        activeAvgElevator={activeAvgElevator}
        activeAvgRepair={activeAvgRepair}
        activeAvgTrustMgmt={activeAvgTrustMgmt}
        activeAvgHotWater={activeAvgHotWater}
        activeAvgGas={activeAvgGas}
        activeAvgOffice={activeAvgOffice}
        activeAvgTax={activeAvgTax}
        activeAvgClothing={activeAvgClothing}
        activeAvgTraining={activeAvgTraining}
        activeAvgVehicle={activeAvgVehicle}
        activeAvgOtherOverhead={activeAvgOtherOverhead}
        activeAvgDisinfection={activeAvgDisinfection}
        activeAvgNetwork={activeAvgNetwork}
        activeAvgFacility={activeAvgFacility}
        activeAvgSafety={activeAvgSafety}
        activeAvgDisaster={activeAvgDisaster}
        activeAvgTv={activeAvgTv}
        activeAvgSewage={activeAvgSewage}
        activeAvgWaste={activeAvgWaste}
        activeAvgTenantRep={activeAvgTenantRep}
        activeAvgInsurance={activeAvgInsurance}
        activeAvgElection={activeAvgElection}
        activeAvgOtherIndiv={activeAvgOtherIndiv}
      />

      {/* 공유 버튼 */}
      <AptMgmtShareButtons />

    </div>
  );
}
