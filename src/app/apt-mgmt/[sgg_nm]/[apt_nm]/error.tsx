'use client';
import Link from 'next/link';

export default function Error({ error }: { error: Error & { digest?: string } }) {
  return (
    <div className="container mx-auto p-4 max-w-2xl text-center py-16">
      <p className="text-gray-500 mb-4">관리비 데이터를 불러오는 중 문제가 발생했습니다.</p>
      <Link href="/apt-mgmt" className="text-sm text-blue-500 hover:underline">← 관리비 검색으로 돌아가기</Link>
      {error.digest && <p className="text-xs text-gray-400 mt-4">오류코드: {error.digest}</p>}
    </div>
  );
}
