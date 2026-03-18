# 한국농수산식품유통공사_농축수산물 표준코드

참고: 농축수산물 표준코드 API 명세.xlsx

데이터포맷	JSON+XML
End Point	https://apis.data.go.kr/B552845/katCode
일반 인증키(Encoding)	
sSgStyPQhjtwIjM0nJXUigzI0cIESP6%2BCdnhsA%2FwKdigIH%2BPEqIo%2FxmZQ1puT7wDcMdFrWM3e0hFGfKnBvtfAw%3D%3D
일반 인증키(Decoding)	
sSgStyPQhjtwIjM0nJXUigzI0cIESP6+CdnhsA/wKdigIH+PEqIo/xmZQ1puT7wDcMdFrWM3e0hFGfKnBvtfAw==

활용신청 상세기능정보
8	품목코드
/goods	품목코드를 나타내는 정보로 대분류코드, 대분류명, 중분류코드, 중분류명, 소분류코드, 소분류명을 제공한다.	10000	확인


goods_response{
response	{
description:	
response

header	{...}
body	{
description:	
응답 데이터의 바디

dataType	string
응답의 데이터 타입

numOfRows	integer
한 페이지 결과 수

pageNo	integer
페이지번호

totalCount	integer
전체 데이터 수

items	{
description:	
items

item	[
item

{
gds_lclsf_cd	string
상품대분류코드

gds_lclsf_nm	string
상품대분류명

gds_mclsf_cd	string
상품중분류코드

gds_mclsf_nm	string
상품중분류명

gds_sclsf_cd	string
상품소분류코드

gds_sclsf_nm	string
상품소분류명

}]
}
}
}
}



# 한국농수산식품유통공사_연월별 도,소매가격정보 조회

참고문서 (참고)연월별 도,소매가격정보_코드.xlsx, 연월별 도,소매가격정보 API 명세.xlsx


데이터포맷	JSON+XML
End Point	https://apis.data.go.kr/B552845/perYearMonth
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
1	연월별 도,소매가격정보
/price	조회 기간(연월) 동안 중도매인 판매가격 및 소매가격 정보	10000	확인


# 한국농수산식품유통공사_일별 도,소매 가격정보 조회

참고문서	(참고)일별 도,소매 가격정보_코드.xlsx, 일별 도,소매 가격정보 API 명세.xlsx

데이터포맷	JSON+XML
End Point	https://apis.data.go.kr/B552845/perDay
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
1	일별 도,소매 가격정보
/price	조회 기간 동안 일평균 중도매인 판매가격 및 소매가격 정보	10000	확인
요청변수(Request Parameter)닫기

항목명	샘플데이터	설명
serviceKey	
-
공공데이터포털에서 받은 인증키
pageNo	
1
페이지번호 (기본값: 1)
numOfRows	
10
한 페이지 결과 수 (기본값: 10, 최대값: 1000)
cond[exmn_ymd::LTE]	
20251204
조사일자가 검색값과 일치하거나 작은 데이터를 검색
cond[exmn_ymd::GTE]	
20251204
조사일자가 검색값과 일치하거나 큰 데이터를 검색
cond[se_cd::EQ]	
02
검색값과 구분코드가 일치하는 데이터를 검색
cond[ctgry_cd::EQ]	
100
검색값과 부류코드가 일치하는 데이터를 검색
cond[item_cd::EQ]	
111
검색값과 품목코드가 일치하는 데이터를 검색
cond[vrty_cd::EQ]	
01
검색값과 품종코드가 일치하는 데이터를 검색
cond[grd_cd::EQ]	
04
검색값과 등급코드가 일치하는 데이터를 검색
cond[sgg_cd::EQ]	
1101
검색값과 시군구코드가 일치하는 데이터를 검색
cond[mrkt_cd::EQ]	
0110253
검색값과 시장코드가 일치하는 데이터를 검색
returnType	
XML
응답의 데이터 타입을 선택할 수 있습니다. (기본값: JSON) XML형태의 응답결과를 얻기 위해서는 XML(대문자) 값으로 설정
selectable	
item_cd,vrty_cd
응답으로 받고 싶은 컬럼명을 선택하여 검색(구분자','로 다중선택)




# 한국농수산식품유통공사_가격 등락 정보 조회

참고문서	(참고)가격 등락 정보_코드.xlsx, 가격 등락 정보 API 명세.xlsx
데이터포맷	JSON+XML
End Point	https://apis.data.go.kr/B552845/risesAndFalls
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
1	가격 등락 정보
/info	조회일 기준 전일, 전주, 전월, 전년 대비 등락률 정보	10000	확인

요청변수(Request Parameter)닫기

항목명	샘플데이터	설명
serviceKey	
-
공공데이터포털에서 받은 인증키
pageNo	
1
페이지번호 (기본값: 1)
numOfRows	
10
한 페이지 결과 수 (기본값: 10, 최대값: 1000)
cond[exmn_ymd::EQ]	
20251204
검색값과 조사일자가 일치하는 데이터를 검색
cond[se_cd::EQ]	
02
검색값과 구분코드가 일치하는 데이터를 검색
cond[ctgry_cd::EQ]	
100
검색값과 부류코드가 일치하는 데이터를 검색
cond[item_cd::EQ]	
111
검색값과 품목코드가 일치하는 데이터를 검색
cond[vrty_cd::EQ]	
01
검색값과 품종코드가 일치하는 데이터를 검색
cond[grd_cd::EQ]	
04
검색값과 등급코드가 일치하는 데이터를 검색
returnType	
XML
응답의 데이터 타입을 선택할 수 있습니다. (기본값: JSON) XML형태의 응답결과를 얻기 위해서는 XML(대문자) 값으로 설정
selectable	
item_cd,vrty_cd
응답으로 받고 싶은 컬럼명을 선택하여 검색(구분자','로 다중선택)


# 축산물품질평가원_축산물유통정보

참고문서	축산물품질평가원_OpenAPI활용가이드_축산물품질평가원_축산물유통정보_v2.9.docx
데이터포맷	XML
End Point	https://data.ekape.or.kr/openapi-data/service/user/confirm
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
1	축산물 재고동향	거래년월, 축종코드를 통해 축종코드, 품목명, 품목코드, 부위명, 부위 재고량을 조회하는 서비스	1000	확인
2	일자별 축산물소비자가격 정보	기준일자, 축종코드를 통해 축종코드, 축종명, 품목명, 품목코드, 구분명, 단위, 최대가격, 최소가격, 평균가격, 지역별 가격, 평년가격을 조회하는 서비스	1000	확인
3	월별 축산물소비자가격 정보	기준일자, 축종코드를 통해 축종코드, 축종명, 품목명, 품목코드, 구분명, 단위, 가격, 평년가격을 조회하는 서비스	1000	확인
4	닭 검수(소비)확인정보	① 확인서발급일자, 확인서발급번호를 통해 검수(소비)업체사업자번호, 검수(소비)업체명, 검수(소비)일자, 납품업체사업자번호, 납품업체명, 가축코드, 가축명, 부위코드, 부위명, 부위중량 등을 제공하는 ②닭 검수(소비)확인정보를 조회하는 기능 제공	1000	확인
5	소 검수(소비)확인정보	①확인서발급일자, 확인서발급번호를 통해 검수(소비)일자, 납품업체사업자번호, 납품업체명, 확인서발급일자, 확인서발급번호, 가축코드, 가축명 등를 조회하는 ②소 검수(소비)확인정보 조회 기능	1000	확인
6	돼지 검수(소비)확인정보	①확인서발급일자, 확인서발급번호를 통해 검수(소비)업체사업자번호, 검수(소비)업체명, 검수(소비)일자, 납품업체사업자번호, 납품업체명, 가축코드, 가축명, 부위코드, 부위명, 부위중량 등을 제공하는 ②돼지 검수(소비)확인정보 조회 기능 제공	1000	확인
7	계란 검수(소비)확인정보	① 확인서발급일자, 확인서발급번호를 통해 검수(소비)업체사업자번호, 검수(소비)업체명, 검수(소비)일자, 납품업체사업자번호, 납품업체명, 가축코드, 가축명, 부위코드, 부위명, 부위중량 등을 제공하는 ②계란 검수(소비)확인정보를 조회하는 기능 제공	1000	확인
8	오리 검수(소비)확인정보	① 확인서발급일자, 확인서발급번호를 통해 검수(소비)업체사업자번호, 검수(소비)업체명, 검수(소비)일자, 납품업체사업자번호, 납품업체명, 가축코드, 가축명, 부위코드, 부위명, 부위중량 등을 제공하는 ②오리 검수(소비)확인정보를 조회하는 기능 제공	1000	확인
9	순별 축산물소비자가격 정보	기준일자, 축종코드를 통해 축종코드, 축종명, 품목명, 품목코드, 구분명, 단위, 가격, 평년가격을 조회하는 서비스	1000	확인
10	연도별 축산물소비자가격 정보	기준일자, 축종코드를 통해 축종코드, 축종명, 품목명, 품목코드, 구분명, 단위, 가격, 평년가격을 조회하는 서비스	1000	확인


---
목록 
월별 축산물소비자가격 정보
 조회
기준일자, 축종코드를 통해 축종코드, 축종명, 품목명, 품목코드, 구분명, 단위, 가격, 평년가격을 조회하는 서비스
활용승인 절차 개발단계 : 자동승인 / 운영단계 : 자동승인
신청가능 트래픽 개발계정 : 1,000 / 운영계정 : 활용사례 등록시 신청하면 트래픽 증가 가능
요청주소
서비스URL http://data.ekape.or.kr/openapi-data/service/user/grade/consumerPriceMonth
 활용신청
요청변수(Request Parameter)

항목명(국문)	항목명(영문)	항목크기	항목구분	샘플데이터	항목설명
서비스 인증키	serviceKey	100	필		서비스 인증키
기준월	standYm	6	필	202208	기준월
축종코드	judgeKind	4	필	4301	축종코드
출력결과(Response Element)

항목명(국문)	항목명(영문)	항목크기	항목구분	샘플데이터	항목설명
결과코드	resultCode	2	필	00	결과코드
결과메시지	resultMsg	50	필	OK	결과메시지
축종코드	judgeKind	4	옵	4301	축종코드
축종명	judgeKindNm	100	필	소	축종명
품목명	itemNm	100	필	안심	품목명
품목코드	itemCd	100	필	21	품목코드
구분명	grdNm	100	필	1+등급	구분명
단위	unit	100	필	원/100g	단위
가격	ntslPrc	8	필	16031	가격
평년가격	avgYearPrc	8	필	14354	평년가격



목록 
일자별 축산물소비자가격 정보
 조회
기준일자, 축종코드를 통해 축종코드, 축종명, 품목명, 품목코드, 구분명, 단위, 최대가격, 최소가격, 평균가격, 지역별 가격, 평년가격을 조회하는 서비스
활용승인 절차 개발단계 : 자동승인 / 운영단계 : 자동승인
신청가능 트래픽 개발계정 : 1,000 / 운영계정 : 활용사례 등록시 신청하면 트래픽 증가 가능
요청주소
서비스URL http://data.ekape.or.kr/openapi-data/service/user/grade/consumerPriceDaily
 활용신청
요청변수(Request Parameter)

항목명(국문)	항목명(영문)	항목크기	항목구분	샘플데이터	항목설명
서비스 인증키	serviceKey	100	필		서비스 인증키
기준일자	standYmd	8	필	20220630	기준일자
축종코드	judgeKind	4	필	4301	축종코드
품목코드	itemCd	2	필	21	품목코드
출력결과(Response Element)

항목명(국문)	항목명(영문)	항목크기	항목구분	샘플데이터	항목설명
결과코드	resultCode	2	필	00	결과코드
결과메시지	resultMsg	50	필	OK	결과메시지
날짜구분(날짜/평년)	standYmd	8	필	20220630	날짜구분(날짜/평년)
구분명(등급/원산지)	grdNm	100	필	1+등급	구분명(등급/원산지)
축종명	judgeKindNm	100	필	소	축종명
축종코드	judgeKind	4	필	4301	축종코드
품목명	itemNm	100	필	안심	품목명
품목코드	itemCd	2	필	21	품목코드
평균가격	ntslPrc	8	필	16704	평균가격
최대가격	maxPrc	8	필	18564	최대가격
최소가격	minPrc	8	필	15270	최소가격
서울가격	regionPrc1	8	필	18564	서울가격
부산가격	regionPrc2	8	필	16626	부산가격
대구가격	regionPrc3	8	필	16900	대구가격
인천가격	regionPrc4	8	필	17049	인천가격
광주가격	regionPrc5	8	필	17332	광주가격
대전가격	regionPrc6	8	필	17084	대전가격
울산가격	regionPrc7	8	필	15861	울산가격
세종가격	regionPrc8	8	필	17394	세종가격
경기가격	regionPrc9	8	필	17751	경기가격
강원가격	regionPrc10	8	필	16515	강원가격
충북가격	regionPrc11	8	필	16558	충북가격
충남가격	regionPrc12	8	필	15767	충남가격
전북가격	regionPrc13	8	필	15744	전북가격
전남가격	regionPrc14	8	필	15270	전남가격
경북가격	regionPrc15	8	필	15817	경북가격
경남가격	regionPrc16	8	필	16374	경남가격
제주가격	regionPrc17	8	필	15451	제주가격
단위	unit	100	필	원/100g	단위