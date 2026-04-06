// src/apt-mgmt/components/AptMgmtSummaryCards.tsx
// 관리비 분석 결과 — Hero + 순위 바 + 진단 카드

import { MgmtFeeResult } from '@apt-mgmt/types/management-fee';
import { type Tier, tierConfig } from './summaryConfig';
import AptMgmtShareButtons from './AptMgmtShareButtons';
import AptMgmtCompareSection from './AptMgmtCompareSection';
import AptMgmtBuildingChart from './AptMgmtBuildingChart';

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
  if (avgCommon && avgCommon > 0 && (commonVal ?? 0) > avgCommon * (1 + ADVICE_THRESHOLD)) {
    if (tier === 'D' || tier === 'E') {
      return '공용관리비 전반에 대해 입주자 대표회의에서 절감 방안을 논의해보세요.';
    }
    return '공용관리비 항목에 대해 입주자 대표회의에서 논의해보는 것이 좋아요.';
  }

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

function rankScore(rank: number | null, total: number | null): number {
  if (!rank || !total) return 50;
  return Math.round(((total - rank + 1) / total) * 100);
}

/** 백분위 기반 직관적 순위 문구: 상위 N% */
function rankPercentileLabel(rank: number | null, total: number | null): string {
  if (!rank || !total) return '';
  const pct = Math.round((rank / total) * 100);
  if (pct <= 5) return `상위 ${pct}% 이내`;
  if (pct <= 10) return `상위 10%`;
  if (pct <= 20) return `상위 20%`;
  if (pct <= 30) return `상위 30%`;
  if (pct <= 50) return `상위 50%`;
  return `하위 ${100 - pct}%`;
}

function rankLabel(rank: number | null, total: number | null): string {
  if (!rank || !total) return '';
  return `${total.toLocaleString()}개 단지 중 ${rank.toLocaleString()}위`;
}

// 바 색상: 높을수록(저렴할수록) 초록
function scoreColor(score: number): string {
  if (score >= 67) return '#047857'; // ds-success
  if (score >= 40) return '#d97706'; // amber-600
  return '#b91c1c'; // ds-danger
}

function scoreTrackColor(score: number): string {
  if (score >= 67) return '#ECFDF5';
  if (score >= 40) return '#fffbeb';
  return '#fef2f2';
}

// tier별 Hero 배경/테두리 색
const TIER_HERO: Record<Tier, { bg: string; border: string; badge: string; badgeText: string }> = {
  A: { bg: 'var(--ds-success-bg)',  border: '#6ee7b7', badge: '#047857', badgeText: '#fff' },
  B: { bg: '#f0fdf4',               border: '#86efac', badge: '#16a34a', badgeText: '#fff' },
  C: { bg: '#fffbeb',               border: '#fcd34d', badge: '#d97706', badgeText: '#fff' },
  D: { bg: '#fff7ed',               border: '#fdba74', badge: '#ea580c', badgeText: '#fff' },
  E: { bg: 'var(--ds-danger-bg)',   border: '#fca5a5', badge: '#b91c1c', badgeText: '#fff' },
};

/** 게이지 바: 저렴(초록) ──── 우리 위치 표시 ──── 비쌈(빨강) */
interface PeerGaugeRowProps {
  label: string;
  ourValue: number;
  peerMin: number;
  peerAvg: number;
  peerMax: number;
  peerCnt: number;
}

function PeerGaugeRow({ label, ourValue, peerMin, peerMax, peerCnt }: PeerGaugeRowProps) {
  const range = peerMax - peerMin;
  const pos = range > 0 ? Math.max(0, Math.min(100, ((ourValue - peerMin) / range) * 100)) : 50;
  const judgment = pos >= 67 ? '비싼 편' : pos >= 33 ? '보통' : '저렴한 편';
  const jColor = pos >= 67 ? '#b91c1c' : pos >= 33 ? '#d97706' : '#047857';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--ds-ink-muted)' }}>{label}</span>
        <span className="text-xs font-bold" style={{ color: jColor }}>{judgment}</span>
      </div>
      {/* 그라디언트 바 */}
      <div className="relative h-3 rounded-full overflow-hidden"
        style={{ background: 'linear-gradient(to right, #4ade80, #facc15, #f87171)' }}>
        {/* 우리 단지 마커 */}
        <div
          className="absolute top-0 bottom-0 w-1 rounded-sm"
          style={{ left: `calc(${pos}% - 2px)`, background: '#fff', boxShadow: '0 0 0 1.5px #334155' }}
        />
      </div>
      <div className="flex justify-between text-xs" style={{ color: 'var(--ds-ink-faint)' }}>
        <span>저렴 · {Math.round(peerMin / 1000)}천원</span>
        <span>비쌈 · {Math.round(peerMax / 1000)}천원</span>
      </div>
      <p className="text-xs" style={{ color: 'var(--ds-ink-faint)' }}>
        유사 단지 {peerCnt}곳 비교
      </p>
    </div>
  );
}

interface DiagnosisCardProps {
  label: string;
  icon: string;
  perHh: number | null;
  seoulRank: number | null;
  seoulTotal: number | null;
  sggRank: number | null;
  sggTotal: number | null;
  sggNm: string;
  isProblem: boolean;
}

function DiagnosisCard({
  label, icon, perHh, seoulRank, seoulTotal, sggRank, sggTotal, sggNm, isProblem,
}: DiagnosisCardProps) {
  const seoulScore = rankScore(seoulRank, seoulTotal);
  const barColor = scoreColor(seoulScore);
  const trackColor = scoreTrackColor(seoulScore);

  const levelText = seoulScore >= 67 ? '저렴' : seoulScore >= 40 ? '보통' : '높음';
  const levelBg   = seoulScore >= 67 ? '#ECFDF5' : seoulScore >= 40 ? '#fffbeb' : '#fef2f2';
  const levelTc   = seoulScore >= 67 ? '#047857' : seoulScore >= 40 ? '#d97706' : '#b91c1c';

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background: isProblem ? '#fef2f2' : 'var(--ds-cream-card)',
        border: `1px solid ${isProblem ? '#fca5a5' : 'var(--ds-cream-border)'}`,
      }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--ds-ink)' }}>{label}</span>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: isProblem ? '#fee2e2' : levelBg, color: isProblem ? '#b91c1c' : levelTc }}
        >
          {isProblem ? '주의' : levelText}
        </span>
      </div>

      {/* 금액 */}
      {perHh != null && (
        <p className="text-2xl font-extrabold" style={{ color: barColor }}>
          월 {perHh.toLocaleString()}원
        </p>
      )}

      {/* 서울 순위 바 */}
      {seoulRank != null && seoulTotal != null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>서울 전체 순위</span>
            <span className="font-semibold" style={{ color: barColor }}>
              {rankPercentileLabel(seoulRank, seoulTotal)}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: trackColor }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${seoulScore}%`, background: barColor }}
            />
          </div>
          <p className="text-xs text-gray-400">{rankLabel(seoulRank, seoulTotal)}</p>
        </div>
      )}

      {/* 구 순위 */}
      {sggRank != null && sggTotal != null && (
        <p className="text-xs text-gray-500">
          {sggNm}: {rankLabel(sggRank, sggTotal)}
        </p>
      )}
    </div>
  );
}

export interface AptMgmtSummaryCardsExports {
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

export default function AptMgmtSummaryCards({ result }: Props) {
  const useUmd = (result.umd_total ?? 0) >= 5;
  const activeRank  = useUmd ? result.umd_rank  : result.sgg_rank;
  const activeTotal = useUmd ? result.umd_total : result.sgg_total;

  const tier = toTier(activeRank, activeTotal);
  const config = tier ? tierConfig[tier] : null;
  const heroStyle = tier ? TIER_HERO[tier] : TIER_HERO['C'];

  const sggRank  = result.sgg_rank  ?? 0;
  const sggTotal = result.sgg_total ?? 0;

  const personalFee = (result.total_per_hh != null && result.common_per_hh != null)
    ? result.total_per_hh - result.common_per_hh
    : null;

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

  const commonDiff   = (result.common_per_hh ?? 0) - (activeAvgCommon   ?? 0);
  const personalDiff = (personalFee          ?? 0) - (activeAvgPersonal ?? 0);

  const titleTemplate = useUmd ? config?.title         : config?.fallbackTitle;
  const descTemplate  = useUmd ? config?.desc          : config?.fallbackDesc;

  const templateVars = {
    apt_nm:       result.apt_nm,
    sgg_nm:       result.sgg_nm,
    umd_nm:       result.umd_nm ?? result.sgg_nm,
    umd_rank:     activeRank  ?? 0,
    umd_total:    activeTotal ?? 0,
    rank:         sggRank,
    total_count:  sggTotal,
    problem_area: personalDiff >= commonDiff ? '개인관리비' : '공용관리비',
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
      { label: '장기수선충당금',   val: result.ltm_per_hh,                                            avg: activeAvgLtm },
    ],
    tier,
  );

  const descLines = descTemplate
    ? [...interpolate(descTemplate, templateVars).split('\n'), adviceLine]
    : [adviceLine];

  // Hero 핵심 문구 — 서울 기준 백분위
  const seoulScore = rankScore(result.seoul_rank, result.seoul_total);
  const seoulPctLabel = rankPercentileLabel(result.seoul_rank, result.seoul_total);

  return (
    <div className="space-y-5">

      {/* === HERO === */}
      <div
        className="rounded-2xl px-5 py-6"
        style={{ background: heroStyle.bg, border: `1px solid ${heroStyle.border}` }}
      >
        {/* 아파트 이름 + 데이터 기준 */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <p className="text-base font-bold" style={{ color: 'var(--ds-ink)' }}>
              {result.apt_nm}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ds-ink-muted)' }}>
              {formatBillingYm(result.billing_ym)}
              {' · '}{useUmd ? (result.umd_nm ?? result.sgg_nm) : result.sgg_nm} 기준
              {result.household_cnt ? ` · ${result.household_cnt.toLocaleString()}세대` : ''}
            </p>
          </div>
          {tier && (
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: heroStyle.badge, color: heroStyle.badgeText }}
            >
              Tier {tier}
            </span>
          )}
        </div>

        {/* 핵심 수치 */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-2 mb-4">
          <p
            className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-none"
            style={{ color: config?.color ? undefined : 'var(--ds-ink)', ...(config?.color ? { color: undefined } : {}) }}
          >
            <span className={config?.color ?? ''}>
              {result.total_per_hh != null
                ? `월 ${result.total_per_hh.toLocaleString()}원`
                : '데이터 없음'}
            </span>
          </p>
          {seoulPctLabel && (
            <span
              className="text-sm font-semibold px-2.5 py-1 rounded-full self-start sm:self-auto mb-0.5"
              style={{
                background: scoreColor(seoulScore) + '18',
                color: scoreColor(seoulScore),
              }}
            >
              서울 {seoulPctLabel}
            </span>
          )}
        </div>

        {/* 제목 */}
        <h2 className="text-lg font-semibold leading-snug mb-2" style={{ color: 'var(--ds-ink)' }}>
          {title}
        </h2>

        {/* 설명 */}
        <div className="space-y-1">
          {descLines.map((line, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: 'var(--ds-ink-muted)' }}>
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* === 단지 프로필 칩 === */}
      {(result.avg_pyeong || result.avg_price || result.build_year || result.household_cnt) && (
        <div className="flex flex-wrap gap-2">
          {result.avg_pyeong && (
            <span className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ background: 'var(--ds-cream-card)', border: '1px solid var(--ds-cream-border)', color: 'var(--ds-ink-muted)' }}>
              평균 {result.avg_pyeong}평형
            </span>
          )}
          {result.avg_price && (
            <span className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ background: 'var(--ds-cream-card)', border: '1px solid var(--ds-cream-border)', color: 'var(--ds-ink-muted)' }}>
              평균 {result.avg_price}억
            </span>
          )}
          {result.build_year && (
            <span className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ background: 'var(--ds-cream-card)', border: '1px solid var(--ds-cream-border)', color: 'var(--ds-ink-muted)' }}>
              {result.build_year}년 준공
            </span>
          )}
          {result.household_cnt && (
            <span className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{ background: 'var(--ds-cream-card)', border: '1px solid var(--ds-cream-border)', color: 'var(--ds-ink-muted)' }}>
              {result.household_cnt.toLocaleString()}세대
            </span>
          )}
        </div>
      )}

      {/* === 유사 단지 비교 (피어 그룹) === */}
      {result.total_per_hh != null && result.peer_seoul_avg != null && result.peer_seoul_min != null && result.peer_seoul_max != null ? (
        <div
          className="rounded-2xl px-5 py-5 space-y-5"
          style={{ background: 'var(--ds-cream-card)', border: '1px solid var(--ds-cream-border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ds-ink-faint)' }}>
            유사 평형·가격 단지 비교
          </p>

          {/* 서울 — 건물 차트 */}
          <div>
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--ds-ink-muted)' }}>서울 전체</p>
            <AptMgmtBuildingChart
              ourValue={result.total_per_hh}
              peerMin={result.peer_seoul_min}
              peerAvg={result.peer_seoul_avg}
              peerMax={result.peer_seoul_max}
              peerCnt={result.peer_seoul_cnt ?? 0}
              scopeLabel="서울 전체"
            />
          </div>

          {/* 구 — 게이지 바 */}
          {result.peer_sgg_cnt && result.peer_sgg_avg && result.peer_sgg_min != null && result.peer_sgg_max != null && (
            <PeerGaugeRow
              label={result.sgg_nm}
              ourValue={result.total_per_hh}
              peerMin={result.peer_sgg_min}
              peerAvg={result.peer_sgg_avg}
              peerMax={result.peer_sgg_max}
              peerCnt={result.peer_sgg_cnt}
            />
          )}

          {/* 동 — 게이지 바 (5개 이상일 때만) */}
          {result.peer_umd_cnt && result.peer_umd_avg && result.peer_umd_min != null && result.peer_umd_max != null && result.umd_nm && (
            <PeerGaugeRow
              label={result.umd_nm}
              ourValue={result.total_per_hh}
              peerMin={result.peer_umd_min}
              peerAvg={result.peer_umd_avg}
              peerMax={result.peer_umd_max}
              peerCnt={result.peer_umd_cnt}
            />
          )}
        </div>
      ) : (
        /* 피어 데이터 없을 때 — 기존 순위 바 */
        <div
          className="rounded-2xl px-5 py-5 space-y-4"
          style={{ background: 'var(--ds-cream-card)', border: '1px solid var(--ds-cream-border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ds-ink-faint)' }}>
            관리비 순위 비교
          </p>
          {[
            { label: '동네', rank: result.umd_rank, total: result.umd_total },
            { label: result.sgg_nm, rank: result.sgg_rank, total: result.sgg_total },
            { label: '서울 전체', rank: result.seoul_rank, total: result.seoul_total },
          ].map(({ label, rank, total }) => {
            const score = rankScore(rank, total);
            const barColor = scoreColor(score);
            const trackColor = scoreTrackColor(score);
            return (
              <div key={label} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium shrink-0 w-20" style={{ color: 'var(--ds-ink-muted)' }}>{label}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: trackColor }}>
                    <div className="h-full rounded-full" style={{ width: `${score}%`, background: barColor }} />
                  </div>
                  <span className="text-xs font-bold shrink-0 w-16 text-right" style={{ color: barColor }}>
                    {rankPercentileLabel(rank, total)}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--ds-ink-faint)' }}>{rankLabel(rank, total)}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* === 공용 / 개인 진단 카드 === */}
      {(result.common_seoul_rank || result.personal_seoul_rank) && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--ds-ink-faint)' }}>
            공용 · 개인 관리비 진단
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DiagnosisCard
              label="공용관리비"
              icon="🏢"
              perHh={result.common_per_hh}
              seoulRank={result.common_seoul_rank}
              seoulTotal={result.seoul_total}
              sggRank={result.common_sgg_rank}
              sggTotal={result.sgg_total}
              sggNm={result.sgg_nm}
              isProblem={commonDiff > 0 && commonDiff >= personalDiff}
            />
            <DiagnosisCard
              label="개인관리비"
              icon="🏠"
              perHh={personalFee}
              seoulRank={result.personal_seoul_rank}
              seoulTotal={result.seoul_total}
              sggRank={result.personal_sgg_rank}
              sggTotal={result.sgg_total}
              sggNm={result.sgg_nm}
              isProblem={personalDiff > 0 && personalDiff > commonDiff}
            />
          </div>
        </div>
      )}

      {/* === 주요 항목 비교 테이블 === */}
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

      {/* === 공유 버튼 === */}
      <AptMgmtShareButtons />

    </div>
  );
}
