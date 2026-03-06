# K-APT API 명세

공동주택관리정보시스템 (K-APT) 공공데이터포털 API
국토교통부_공동주택 기본 정보제공 서비스

Base URL: apis.data.go.kr/1613000/AptBasisInfoServiceV4

---

## getAphusBassInfoV4 — 단지 기본정보

**요청 파라미터**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `serviceKey` | string | 공공데이터포털 인증키 |
| `kaptCode` | string | 단지코드 |

**응답 필드**

| 필드 | 타입 | 설명 |
|------|------|------|
| `zipcode` | string | 우편번호 |
| `kaptCode` | string | 단지코드 |
| `kaptName` | string | 단지명 |
| `kaptAddr` | string | 법정동주소 |
| `codeSaleNm` | string | 분양형태 |
| `codeHeatNm` | string | 난방방식 |
| `kaptTarea` | number | 연면적 |
| `kaptDongCnt` | number | 동수 |
| `kaptdaCnt` | string | 세대수 |
| `kaptBcompany` | string | 시공사 |
| `kaptAcompany` | string | 시행사 |
| `kaptTel` | string | 관리사무소 연락처 |
| `kaptFax` | string | 관리사무소 팩스 |
| `kaptUrl` | string | 홈페이지 주소 |
| `codeAptNm` | string | 단지분류 |
| `doroJuso` | string | 도로명주소 |
| `hoCnt` | number | 호수 |
| `codeMgrNm` | string | 관리방식 |
| `codeHallNm` | string | 복도유형 |
| `kaptUsedate` | string | 사용승인일 |
| `kaptMarea` | number | 관리비부과면적 |
| `kaptMparea60` | number | 전용면적별 세대현황 (60㎡ 이하) |
| `kaptMparea85` | number | 전용면적별 세대현황 (60~85㎡) |
| `kaptMparea135` | number | 전용면적별 세대현황 (85~135㎡) |
| `kaptMparea136` | number | 전용면적별 세대현황 (135㎡ 초과) |
| `privArea` | number | 단지 전용면적합 (㎡) ← `avg_area_m2` 계산에 사용 |
| `bjdCode` | string | 법정동코드 |
| `kaptTopFloor` | number | 최고층수 |
| `ktownFlrNo` | number | 최고층수 (건축물대장) |
| `kaptBaseFloor` | number | 지하층수 |
| `kaptdEcntp` | number | 승객용 승강기대수 |

> `avg_area_m2 = privArea / parseInt(kaptdaCnt)` — `privArea`가 없거나 0이면 null 처리

---

## getAphusDtlInfoV4 — 단지 상세정보

**요청 파라미터**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `serviceKey` | string | 공공데이터포털 인증키 |
| `kaptCode` | string | 단지코드 |

**응답 필드**

| 필드 | 타입 | 설명 |
|------|------|------|
| `kaptCode` | string | 단지코드 |
| `kaptName` | string | 단지명 |
| `codeMgr` | string | 일반관리방식 |
| `kaptMgrCnt` | number | 일반관리인원 |
| `kaptCcompany` | string | 일반관리 계약업체 |
| `codeSec` | string | 경비관리방식 |
| `kaptdScnt` | number | 경비관리인원 |
| `kaptdSecCom` | string | 경비관리 계약업체 |
| `codeClean` | string | 청소관리방식 |
| `kaptdClcnt` | number | 청소관리인원 |
| `codeGarbage` | string | 음식물처리방법 |
| `codeDisinf` | string | 소독관리방식 |
| `kaptdDcnt` | number | 소독관리 연간 소독횟수 |
| `disposalType` | string | 소독방법 |
| `codeStr` | string | 건물구조 |
| `kaptdEcapa` | number | 수전용량 |
| `codeEcon` | string | 세대전기계약방식 |
| `codeEmgr` | string | 전기안전관리자 법정선임여부 |
| `codeFalarm` | string | 화재수신반방식 |
| `codeWsupply` | string | 급수방식 |
| `codeElev` | string | 승강기관리형태 |
| `kaptdEcnt` | number | 승강기대수 |
| `kaptdPcnt` | number | 주차대수 (지상) |
| `kaptdPcntu` | number | 주차대수 (지하) |
| `codeNet` | string | 주차관제·홈네트워크 |
| `kaptdCccnt` | number | CCTV 대수 |
| `welfareFacility` | string | 부대·복리시설 |
| `kaptdWtimebus` | string | 버스정류장 거리 |
| `subwayLine` | string | 지하철 호선 |
| `subwayStation` | string | 지하철역명 |
| `kaptdWtimesub` | string | 지하철역 거리 |
| `convenientFacility` | string | 편의시설 |
| `educationFacility` | string | 교육시설 |
| `groundElChargerCnt` | number | 지상 전기차 충전대수 |
| `undergroundElChargerCnt` | number | 지하 전기차 충전대수 |
| `useYn` | string | 사용유무 |

---

## 주요 활용 필드

- **`raw-data/kapt-info/*.json`**: `getAphusBassInfoV4` 응답 캐시
- **`avg_area_m2` 계산**: `privArea / parseInt(kaptdaCnt)` (단지 평균 전용면적)
- **`kaptdaCnt`**: API 응답은 **string** 타입 → 사용 전 `parseInt()` 필요
