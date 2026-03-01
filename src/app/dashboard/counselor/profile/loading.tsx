export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="bg-primary pt-20 pb-10 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-4 w-32 bg-white/20 rounded" />
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full" />
            <div className="space-y-2">
              <div className="h-7 w-48 bg-white/20 rounded" />
              <div className="h-4 w-36 bg-white/20 rounded" />
            </div>
          </div>
        </div>
      </div>
      <div className="px-6 lg:px-8 -mt-4 pb-12">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="bg-white rounded-xl h-64 shadow-sm" />
          <div className="bg-white rounded-xl h-48 shadow-sm" />
        </div>
      </div>
    </div>
  );
}
