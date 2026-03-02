export default function AppointmentDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary pt-20 pb-10 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="h-8 w-56 bg-white/20 rounded animate-pulse" />
          <div className="h-4 w-40 bg-white/10 rounded animate-pulse mt-2" />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-6 lg:px-8 -mt-4 pb-12">
        <div className="space-y-6 pt-6">
          {/* Back button skeleton */}
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Profile skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 bg-gray-50 flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse" />
                  <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mt-3" />
                  <div className="h-3 w-44 bg-gray-100 rounded animate-pulse mt-2" />
                </div>
                <div className="p-5 space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Details skeleton */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="h-6 w-44 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-56 bg-gray-100 rounded animate-pulse mt-2" />
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-px bg-gray-200" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="flex gap-3">
                  <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-10 w-28 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="h-10 w-24 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
