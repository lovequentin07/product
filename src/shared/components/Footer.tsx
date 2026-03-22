import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-sm font-medium text-gray-700">DataZip</p>
          <nav className="text-sm text-gray-500">
            <Link href="/privacy-policy" className="hover:text-gray-700 hover:underline">
              개인정보처리방침
            </Link>
          </nav>
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} DataZip
        </p>
      </div>
    </footer>
  );
}
