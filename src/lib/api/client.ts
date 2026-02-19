// src/lib/api/client.ts

import { XMLParser } from 'fast-xml-parser';

const API_BASE_URL = 'https://apis.data.go.kr/1613000';

class OpenApiError extends Error {
  constructor(public errorCode: string, public errorMessage: string) {
    super(`Public Data API Error: ${errorMessage} (Code: ${errorCode})`);
    this.name = 'OpenApiError';
  }
}

// XML 응답을 파싱하여 JSON 객체로 변환하는 유틸리티 함수
export async function parseXmlResponse<T>(xmlString: string): Promise<T> { // Changed return type to Promise<T>
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
  // Remove debug logs
  // console.log('parseXmlResponse - Raw Parsed Result:', JSON.stringify(result, null, 2));
  // console.log('parseXmlResponse - result.response?.header?.resultCode:', result.response?.header?.resultCode);

  // 공통 에러 응답 처리 (API 스펙에 따라 다를 수 있음)
  // resultCode가 '0' 또는 '00'이 아니면 에러로 간주하여 throw
  if (result.response && result.response.header) {
    const resultCode = String(result.response.header.resultCode);
    if (resultCode !== '0' && resultCode !== '00') {
        throw new OpenApiError(resultCode, result.response.header.resultMsg);
    }
  }

  return result as T; // On success, return the full parsed result
}

/**
 * 공공데이터포털 API를 호출하는 범용 클라이언트 함수
 * @param path API 경로 (예: /RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev)
 * @param params 요청 파라미터 객체
 * @returns 파싱된 JSON 응답 데이터
 * @throws {OpenApiError} 공공데이터 API에서 반환된 특정 오류
 * @throws {Error} 네트워크 오류 또는 알 수 없는 오류
 */
export async function callPublicDataApi<T>(
  path: string,
  params: Record<string, string | number>
): Promise<T> {
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
    const parsedData = await parseXmlResponse<T>(xmlText); // parseXmlResponse now throws on API errors

    return parsedData;

  } catch (error) {
    console.error('Failed to fetch public data API:', error);
    if (error instanceof OpenApiError) {
        throw error; // Re-throw specific OpenApiError
    }
    throw new Error((error as Error).message || 'Unknown API error occurred');
  }
}
