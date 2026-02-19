// src/lib/api/client.ts

import { XMLParser } from 'fast-xml-parser';

const API_BASE_URL = 'https://apis.data.go.kr/1613000';

interface OpenApiError {
  errorMessage: string;
  errorCode: string;
  isApiError: true; // Add a discriminant property
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
  console.log('parseXmlResponse - Raw Parsed Result:', JSON.stringify(result, null, 2));
  console.log('parseXmlResponse - result.response?.header?.resultCode:', result.response?.header?.resultCode);

  // 공통 에러 응답 처리 (OpenAPI 스펙에 따라 다를 수 있음)
  if (result.response && result.response.header && result.response.header.resultCode !== '0') {
    return {
      errorMessage: result.response.header.resultMsg,
      errorCode: result.response.header.resultCode,
      isApiError: true, // Tag it as an error
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
): Promise<T> { // Changed return type to Promise<T> as errors are now thrown
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

    // Check if the returned object is an actual OpenApiError
    if (parsedData && typeof parsedData === 'object' && 'isApiError' in parsedData && (parsedData as OpenApiError).isApiError) {
        const error = parsedData as OpenApiError;
        // Only throw if it's an actual error code (not '00' which means success)
        const codeString = String(error.errorCode);
        if (codeString !== '0' && codeString !== '00') {
            console.error(`API Error: ${error.errorCode} - ${error.errorMessage}`);
            throw new Error(`Public Data API Error: ${error.errorMessage}`);
        }
        // If errorCode is '00' with isApiError: true, it means it's a successful response
        // that happened to be wrapped as an OpenApiError - this case should ideally not happen
        // if parseXmlResponse is correctly returning T for success.
        // For robustness, we will assume if errorCode is '00' and it's an OpenApiError,
        // it means the data was valid, and we should cast and return it as T.
        // However, given parseXmlResponse logic, this path should not be reachable for success.
        // So we will proceed assuming if isApiError is true, it's a real error.
        // If somehow success returns isApiError:true and errorCode '00', there's a deeper parsing issue.
    }

    return parsedData as T;

  } catch (error) {
    console.error('Failed to fetch public data API:', error);
    throw new Error((error as Error).message || 'Unknown API error occurred');
  }
}
