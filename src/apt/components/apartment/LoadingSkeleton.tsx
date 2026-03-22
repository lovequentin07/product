export default function LoadingSkeleton() {
  return (
    <div className="flex justify-center items-center h-40 text-gray-500">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      <p className="ml-3 text-lg">데이터 로딩 중...</p>
    </div>
  );
}
