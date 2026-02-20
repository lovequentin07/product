// app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">환영합니다!</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 text-center">
        아래 링크를 통해 아파트 실거래가 조회 서비스로 이동해주세요.
      </p>
      <Link href="/real-estate/transaction" className="px-6 py-3 bg-blue-600 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300">
          아파트 실거래가 조회 서비스로 이동
      </Link>
    </div>
  );
}
