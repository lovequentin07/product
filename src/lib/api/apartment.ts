// src/lib/api/apartment.ts

import { callPublicDataApi } from './client';
import { TransactionItem, NormalizedTransaction, TransactionRequest } from '@/types/real-estate';

const APARTMENT_TRADE_API_PATH = '/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev';

/**
 * 아파트 실거래가 데이터를 공공데이터포털에서 가져와 정규화합니다.
 * @param lawdCd 법정동 코드 (예: 11110)
 * @param dealYmd 계약월 (예: 202402)
 * @returns 정규화된 아파트 실거래가 목록 또는 null (에러 발생 시)
 */
export async function getApartmentTransactions(
  lawdCd: string,
  dealYmd: string
): Promise<NormalizedTransaction[] | null> {
  const params: TransactionRequest = {
    LAWD_CD: lawdCd,
    DEAL_YMD: dealYmd,
    // stdt는 현재 API 명세에 없지만, 추후 확장 가능성을 위해 남겨둠
    // stdt: dealYmd.substring(0, 4) // 예를 들어, stdt가 년도를 의미한다면 이렇게 사용
  };

  try {
    const response: any = await callPublicDataApi(APARTMENT_TRADE_API_PATH, params);

    // API 응답 구조에 따라 items 객체 접근 경로가 달라질 수 있음.
    // 여기서는 service.response.body.items.item 구조를 가정.
    const items: TransactionItem[] = response?.response?.body?.items?.item || [];

    if (!Array.isArray(items) || items.length === 0) {
      console.log(`No data found for LAWD_CD: ${lawdCd}, DEAL_YMD: ${dealYmd}`);
      return [];
    }

    // 데이터 정규화
    const normalizedData: NormalizedTransaction[] = items.map((item: TransactionItem, index: number) => {
      // 거래금액에서 쉼표 제거 및 숫자로 변환
      const price = parseInt(String(item.거래금액).replace(/,/g, ''), 10);
      const dealDate = `${item.년}-${String(item.월).padStart(2, '0')}-${String(item.일).padStart(2, '0')}`;
      const address = `${item.법정동 || ''} ${item.지번 || ''}`.trim();

      return {
        id: `${lawdCd}-${dealYmd}-${index}`, // 각 거래 고유 ID 생성 (임시)
        aptName: item.아파트 || '정보 없음',
        price: isNaN(price) ? 0 : price, // 유효하지 않은 값은 0으로 처리
        area: item.전용면적 || 0,
        date: dealDate,
        address: address,
        floor: item.층 || 0,
        buildYear: item.건축년도 || 0,
        isCancelled: !!item.해제사유발생일, // 해제사유발생일이 있으면 취소된 거래로 간주
      };
    });

    return normalizedData;
  } catch (error) {
    console.error('Error fetching apartment transactions:', error);
    return null;
  }
}
