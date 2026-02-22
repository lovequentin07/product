// src/app/apt/[sgg_nm]/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRegionCodeByName } from '@/data/regions';
import { getRegionApartmentStats } from '@/lib/db/apt';

interface PageProps {
  params: Promise<{ sgg_nm: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { sgg_nm } = await params;
  const decodedSggNm = decodeURIComponent(sgg_nm);
  const title = `${decodedSggNm} 아파트 실거래가`;
  const description = `${decodedSggNm} 아파트 단지별 실거래가, 시세 추이, 거래 이력을 확인하세요. 국토교통부 공공데이터 기반.`;
  const canonicalUrl = `/apt/${sgg_nm}`;
  return {
    title,
    description,
    keywords: [
      `${decodedSggNm} 아파트`,
      `${decodedSggNm} 실거래가`,
      `${decodedSggNm} 아파트 시세`,
      `${decodedSggNm} 매매가`,
      `${decodedSggNm} 아파트 단지`,
    ],
    alternates: { canonical: canonicalUrl },
    openGraph: { title, description, url: canonicalUrl },
  };
}

export default async function RegionPage({ params }: PageProps) {
  const { sgg_nm } = await params;
  const decodedSggNm = decodeURIComponent(sgg_nm);
  const sgg_cd = getRegionCodeByName(decodedSggNm);
  if (!sgg_cd) notFound();

  const apartments = await getRegionApartmentStats(sgg_cd);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '홈', item: 'https://datazip.net' },
      { '@type': 'ListItem', position: 2, name: '실거래가 조회', item: 'https://datazip.net/apt' },
      { '@type': 'ListItem', position: 3, name: `${decodedSggNm} 아파트 실거래가` },
    ],
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Link
        href="/apt"
        className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4"
      >
        ← 실거래가 조회로 돌아가기
      </Link>

      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {decodedSggNm} 아파트 실거래가
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
          {decodedSggNm}에 위치한 아파트 단지별 매매 시세와 거래 이력을 확인하세요.
          국토교통부 실거래가 공개 자료 기준 총{' '}
          <strong className="text-gray-800 dark:text-gray-200">
            {apartments.length.toLocaleString()}개 단지
          </strong>
          의 매매 이력을 제공합니다.
        </p>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            <tr>
              <th className="text-left px-4 py-3 font-medium">아파트</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">동</th>
              <th className="text-right px-4 py-3 font-medium">평균 매매가</th>
              <th className="text-right px-4 py-3 font-medium hidden md:table-cell">거래건수</th>
              <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">최근 거래</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {apartments.map((apt) => (
              <tr
                key={apt.apt_nm}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/apt/${sgg_nm}/${encodeURIComponent(apt.apt_nm)}`}
                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {apt.apt_nm}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                  {apt.umd_nm}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-800 dark:text-gray-200">
                  {apt.avg_billion > 0 ? `${apt.avg_billion}억` : '-'}
                </td>
                <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 hidden md:table-cell">
                  {apt.total_count.toLocaleString()}건
                </td>
                <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                  {apt.latest_date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {apartments.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            해당 지역의 거래 데이터가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
