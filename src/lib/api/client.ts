// src/lib/api/client.ts

import { XMLParser } from 'fast-xml-parser';

const API_BASE_URL = 'https://apis.data.go.kr/1613000';

interface OpenApiError {
  errorMessage: string;
  errorCode: string;
}

// XML 응답을 파싱하여 JSON 객체로 변환하는 유틸리티 함수
export async function parseXmlResponse<T>(xmlString: string): Promise<T | OpenApiError> {
  const parser = new XMLParser({
    attributeNamePrefix: '',
    ignoreAttributes: false,
    parseTagValue: true,
    parseAttributeValue: true,
    trimValues: true,
    // XML 파싱 옵션: 배열로 처리될 태그들을 명시하여 단일 항목일 경우에도 배열로 반환되도록 함
    // 공공데이터 API 응답에서 item 태그가 하나만 있을 경우 객체로 파싱되는 문제 방지
    isArray: (tagName, jPath, isArray) => {
      if (tagName === 'item') return true;
      return false;
    }
  });

  const result = parser.parse(xmlString);

  // 공통 에러 응답 처리 (OpenAPI 스펙에 따라 다를 수 있음)
  if (result.response && result.response.header && result.response.header.resultCode !== '00') {
    return {
      errorMessage: result.response.header.resultMsg,
      errorCode: result.response.header.resultCode,
    };
  }

  return result;
}

/**
 * 공공데이터포털 API를 호출하는 범용 클라이언트 함수
 * @param path API 경로 (예: /RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev)
 * @param params 요청 파라미터 객체
 * @returns 파싱된 JSON 응답 데이터
 */
export async function callPublicDataApi<T>(
  path: string,
  params: Record<string, string | number>
): Promise<T | OpenApiError> {
  // .env.local에 정의된 API 키 사용
  const serviceKey = process.env.DATA_GO_KR_API_KEY;

  if (!serviceKey) {
    throw new Error('API Key is not defined in .env.local');
  }

  // URLSearchParams를 사용하여 쿼리 파라미터 생성 (자동 인코딩)
  const queryParams = new URLSearchParams({
    serviceKey: serviceKey,
    ...params,
  });

  const url = `${API_BASE_URL}${path}?${queryParams.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    const parsedData = await parseXmlResponse<T>(xmlText);

    // 파싱된 데이터가 에러 객체인지 확인
    if (parsedData && typeof parsedData === 'object' && 'errorCode' in parsedData) {
      console.error(`API Error: ${parsedData.errorCode} - ${parsedData.errorMessage}`);
      throw new Error(`Public Data API Error: ${parsedData.errorMessage}`);
    }

    return parsedData;

  } catch (error) {
    console.error('Failed to fetch public data API:', error);
    // 에러 발생 시 OpenApiError 형식으로 반환하거나, 에러를 다시 throw 할 수 있음
    return {
      errorMessage: (error as Error).message || 'Unknown API error occurred',
      errorCode: 'API_CALL_FAILED',
    };
  }
}

// .env.local 파일에 DATA_GO_KR_API_KEY를 설정해주세요.
// 예: DATA_GO_KR_API_KEY=YOUR_DECODED_API_KEY
