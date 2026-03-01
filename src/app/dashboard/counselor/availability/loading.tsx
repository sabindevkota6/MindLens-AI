export default function AvailabilityLoading() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 animate-pulse">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-8 space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-72 bg-gray-100 rounded" />
        </div>
        <div className="h-12 bg-white rounded-xl border border-gray-200 mb-6" />
        <div className="bg-white rounded-xl h-96 shadow-sm" />
      </div>
    </div>
  );
}
