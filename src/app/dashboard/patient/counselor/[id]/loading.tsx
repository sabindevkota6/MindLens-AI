export default function CounselorDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="bg-primary pt-20 pb-10 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="h-4 w-32 bg-white/20 rounded" />
          <div className="h-8 w-64 bg-white/20 rounded" />
          <div className="h-5 w-48 bg-white/20 rounded" />
        </div>
      </div>
      <div className="px-6 lg:px-8 -mt-4 pb-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 mt-8">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-xl h-48 shadow-sm" />
            <div className="bg-white rounded-xl h-32 shadow-sm" />
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-xl h-64 shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
