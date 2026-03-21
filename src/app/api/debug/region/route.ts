import { headers } from 'next/headers'
import { detectRegion } from '@/lib/region'

export async function GET() {
  const headersList = await headers()
  const cfCity = headersList.get('CF-IPCity') ?? 'NOT_PROVIDED'
  const detectedSggCd = detectRegion(headersList)

  return Response.json({
    cfIpCity: cfCity,
    detectedSggCd: detectedSggCd,
    allRelevantHeaders: {
      'CF-IPCity': headersList.get('CF-IPCity'),
      'CF-IPCountry': headersList.get('CF-IPCountry'),
      'CF-IPRegion': headersList.get('CF-IPRegion'),
      'CF-IPRegionCode': headersList.get('CF-IPRegionCode'),
      'CF-IPLatitude': headersList.get('CF-IPLatitude'),
      'CF-IPLongitude': headersList.get('CF-IPLongitude'),
    },
  })
}
