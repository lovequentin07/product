# 국토교통부_공동주택 단지 목록 서비스
- API 유형: REST
- 데이터포맷: JSON
- End Point: https://apis.data.go.kr/1613000/AptListService3
- 설명: 공동주택관리정보시스템에 가입한 전국 모든 단지 코드, 단지명을 조회

## Parameters
- serviceKey (필수): 인증키
- pageNo: 페이지번호
- numOfRows: 목록 건수

## Response
```json
{
  "body": {
    "items": [
      {
        "kaptCode": "string",
        "kaptName": "string",
        "as1": "string",  // 시도명
        "as2": "string",  // 시군구명
        "as3": "string",  // 읍면명
        "as4": "string",  // 동명
        "bjdCode": "string"
      }
    ],
    "numOfRows": "string",
    "pageNo": "string",
    "totalCount": "string"
  }
}
```

---

# 국토교통부_공동주택 단지 기본 정보
- API 유형	REST	
- 데이터포맷	JSON
- 공공데이터포털 url: https://www.data.go.kr/data/15058453/openapi.do

데이터포맷	JSON
End Point	https://apis.data.go.kr/1613000/AptBasisInfoServiceV4
API 환경 또는 API 호출 조건에 따라 인증키가 적용되는 방식이 다를 수 있습니다.
포털에서 제공되는 Encoding/Decoding 된 인증키를 적용하면서 구동되는 키를 사용하시기 바랍니다.
* 향후 포털에서 더 명확한 정보를 제공하기 위해 노력하겠습니다.
일반 인증키
(Encoding)	
sSgStyPQhjtwIjM0nJXUigzI0cIESP6%2BCdnhsA%2FwKdigIH%2BPEqIo%2FxmZQ1puT7wDcMdFrWM3e0hFGfKnBvtfAw%3D%3D
일반 인증키
(Decoding)	
sSgStyPQhjtwIjM0nJXUigzI0cIESP6+CdnhsA/wKdigIH+PEqIo/xmZQ1puT7wDcMdFrWM3e0hFGfKnBvtfAw==
활용신청 상세기능정보

NO	상세기능	설명	일일 트래픽	미리보기
1	국토교통부_공동주택 상세 정보조회
/getAphusDtlInfoV4	단지코드를 이용해 단지코드, 단지명, 일반관리방식, 일반관리인원, 일반관리 계약업체, 경비관리방식, 경비관리인원, 경비관리 계약업체, 청소관리방식, 청소관리인원, 음식물처리방법, 소독관리방식, 소독관리 연간소독횟수, 소독방법, 건물구조, 수전용량, 세대전기계약방식, 전기안전관리자법정선임여부, 화재수신반방식, 급수방식, 승강기관리형태, 승강기대수, 주차대수(지상), 주차대수(지하), 주차관제.홈네트워크, CCTV대수, 부대.복리시설, 버스정류장 거리, 지하철호선, 지하철역명, 지하철역 거리, 편의시설, 교육시설을 조회할 수 있는 공동주택 상세 정보제공 서비스	10000	확인
2	국토교통부_공동주택 기본 정보조회
/getAphusBassInfoV4	단지코드를 이용해 단지명, 법정동주소, 분양형태, 난방방식, 건축물대장상 연면적, 동수, 세대수, 시공사, 시행사, 관리사무소연락처, 관리사무소팩스, 홈페이지주소, 단지분류, 도로명주소, 호수, 관리방식, 복도유형, 사용승인일, 관리비부과면적, 전용면적별 세대현황, 단지 전용면적합, 법정동코드를 조회할 수 있는 공동주택 기본 정보제공 서비스	10000	확인


국토교통부_공동주택 기본 정보제공 서비스
 1.0.0 
[ Base URL: apis.data.go.kr/1613000/AptBasisInfoServiceV4 ]
(공동주택 기본정보)공동주택관리정보시스템에 가입한 단지의 기본정보 및 상세정보 제공

API 목록


GET
/getAphusDtlInfoV4
국토교통부_공동주택 상세 정보조회
단지코드를 이용해 단지코드, 단지명, 일반관리방식, 일반관리인원, 일반관리 계약업체, 경비관리방식, 경비관리인원, 경비관리 계약업체, 청소관리방식, 청소관리인원, 음식물처리방법, 소독관리방식, 소독관리 연간소독횟수, 소독방법, 건물구조, 수전용량, 세대전기계약방식, 전기안전관리자법정선임여부, 화재수신반방식, 급수방식, 승강기관리형태, 승강기대수, 주차대수(지상), 주차대수(지하), 주차관제.홈네트워크, CCTV대수, 부대.복리시설, 버스정류장 거리, 지하철호선, 지하철역명, 지하철역 거리, 편의시설, 교육시설을 조회할 수 있는 공동주택 상세 정보제공 서비스

Parameters
OpenAPI 실행 준비
Name	Description
ServiceKey *
string
(query)
공공데이터포털에서 받은 인증키

ServiceKey
kaptCode *
string
(query)
단지코드

kaptCode
Responses
Code	Description
200	
성공

Example Value
Model
{
  "header": {
    "resultCode": "string",
    "resultMsg": "string"
  },
  "body": {
    "item": {
      "undergroundElChargerCnt": 0,
      "kaptCode": "string",
      "kaptName": "string",
      "codeMgr": "string",
      "kaptMgrCnt": 0,
      "kaptCcompany": "string",
      "codeSec": "string",
      "kaptdScnt": 0,
      "kaptdSecCom": "string",
      "codeClean": "string",
      "kaptdClcnt": 0,
      "codeGarbage": "string",
      "codeDisinf": "string",
      "kaptdDcnt": 0,
      "disposalType": "string",
      "codeStr": "string",
      "kaptdEcapa": 0,
      "codeEcon": "string",
      "codeEmgr": "string",
      "codeFalarm": "string",
      "codeWsupply": "string",
      "codeElev": "string",
      "kaptdEcnt": 0,
      "kaptdPcnt": 0,
      "kaptdPcntu": 0,
      "codeNet": "string",
      "kaptdCccnt": 0,
      "welfareFacility": "string",
      "kaptdWtimebus": "string",
      "subwayLine": "string",
      "subwayStation": "string",
      "kaptdWtimesub": "string",
      "convenientFacility": "string",
      "educationFacility": "string",
      "groundElChargerCnt": 0,
      "useYn": "string"
    }
  }
}

GET
/getAphusBassInfoV4
국토교통부_공동주택 기본 정보조회
단지코드를 이용해 단지명, 법정동주소, 분양형태, 난방방식, 건축물대장상 연면적, 동수, 세대수, 시공사, 시행사, 관리사무소연락처, 관리사무소팩스, 홈페이지주소, 단지분류, 도로명주소, 호수, 관리방식, 복도유형, 사용승인일, 관리비부과면적, 전용면적별 세대현황, 단지 전용면적합, 법정동코드를 조회할 수 있는 공동주택 기본 정보제공 서비스

Parameters
OpenAPI 실행 준비
Name	Description
serviceKey *
string
(query)
공공데이터포털에서 발급받은 인증키

serviceKey
kaptCode *
string
(query)
단지코드

kaptCode
Responses
Code	Description
200	
성공

Example Value
Model
{
  "header": {
    "resultCode": "string",
    "resultMsg": "string"
  },
  "body": {
    "item": {
      "zipcode": "string",
      "kaptCode": "string",
      "kaptName": "string",
      "kaptAddr": "string",
      "codeSaleNm": "string",
      "codeHeatNm": "string",
      "kaptTarea": 0,
      "kaptDongCnt": 0,
      "kaptdaCnt": "string",
      "kaptBcompany": "string",
      "kaptAcompany": "string",
      "kaptTel": "string",
      "kaptFax": "string",
      "kaptUrl": "string",
      "codeAptNm": "string",
      "doroJuso": "string",
      "hoCnt": 0,
      "codeMgrNm": "string",
      "codeHallNm": "string",
      "kaptUsedate": "string",
      "kaptMarea": 0,
      "kaptMparea60": 0,
      "kaptMparea85": 0,
      "kaptMparea135": 0,
      "kaptMparea136": 0,
      "privArea": 0,
      "bjdCode": "string",
      "kaptTopFloor": 0,
      "ktownFlrNo": 0,
      "kaptBaseFloor": 0,
      "kaptdEcntp": 0
    }
  }
}

Models




# 국토교통부_공동주택관리비(공용관리비)정보제공서비스
- API 유형	REST	
- 데이터포맷	JSON
- 공공데이터포털 url:  https://www.data.go.kr/data/15057937/openapi.do#tab_layer_detail_function

# 국토교통부_공동주택관리비(개별사용료)정보제공서비스
- API 유형	REST	
- 데이터포맷	JSON
- 공공데이터포털 url:  https://www.data.go.kr/data/15059469/openapi.do#tab_layer_detail_function

# 국토교통부_공동주택관리비(장기수선충당금)정보서비스
- API 유형	REST	
- 데이터포맷	JSON
- 공공데이터포털 url:  https://www.data.go.kr/data/15059160/openapi.do

# 국토교통부_공동주택 에너지 사용 정보
- API 유형	REST	
- 데이터포맷	JSON
- 공공데이터포털 url:  https://www.data.go.kr/data/15012964/openapi.do

# 국토교통부_공동주택 단지 관리비 정보
- 제공형태	기관자체에서 다운로드(제공데이터URL기재)
- URL	https://www.k-apt.go.kr/web/board/webReference/boardView.do?seq=21&boardSecret=0&boardType=03&pageNo=1&keyword=&board_pwd=&scodeT=03
- 설명	공동주택 관리비의 투명성을 확보하고 입주민의 알 권리를 보장하기 위해, 전국의 공동주택 관리주체는 K-apt 시스템을 통해 월별 관리비 내역을 공개하고 있습니다. 공개되는 정보에는 공용관리비, 개별사용료, 장기수선충당금 등 다양한 항목이 포함되며, 이를 기반으로 전국 단지의 관리비 정보를 연간 단위로 정리한 데이터가 공공에 개방됩니다. 국민 누구나 해당 정보를 열람하고 타 단지와 비교·분석할 수 있도록 제공하여, 관리비에 대한 신뢰성과 공동주택 관리의 투명성을 높이는 데 기여하고 있습니다.
- 공공데이터포털 url: https://www.data.go.kr/data/3039714/fileData.do