# 서울특별시농수산식품공사_주요 품목 가격
- 가락시장 농산물 주요품목 가격(등급별가격)을 제공하는 오픈API입니다.
- 검색일자, 전일날짜, 부류구분, 시장구분, 품목명을 입력하면 품목명, 품목코드, 등급, 거래수량, 거래단위수량, 평균가격, 전일대비 지수를 반환합니다.
- 관련주소 : https://www.garak.co.kr/homepage/M0000258/publicdata/selectPageListPublicData.do?publicDataRealmSn => 공공데이터 분야 (유통정보 - 주요품목가격) 선택 후 신청
---

# API 명세서 링크
- https://www.garak.co.kr/homepage/M0000257/content/view.do

## 필요 API 
- 주요품목가격: https://www.data.go.kr/data/15004517/openapi.do
- 품목별등급별가격(도매시장법인): https://www.data.go.kr/data/15076053/openapi.do
- 품목별등급별가격(중도매인): https://www.data.go.kr/data/15076054/openapi.do
- 주요품목가격(수입농산물): https://www.data.go.kr/data/15076050/openapi.do
- 반입물량정보(정산후): https://www.data.go.kr/data/15076025/openapi.do
- 기간평균가격(주간): https://www.data.go.kr/data/15076044/openapi.do
- 기간평균가격(월간): https://www.data.go.kr/data/15076036/openapi.do
- 품목별최근5개년가격: https://www.data.go.kr/data/15075998/openapi.do

## 품목코드 획득 방법
- 품목코드 API는 없음 (가격 API 응답 필드로 제공).
    - 주요품목가격: https://www.data.go.kr/data/15004517/openapi.do
    - 주요품목가격(수입품목전용): https://www.data.go.kr/data/15076050/openapi.do