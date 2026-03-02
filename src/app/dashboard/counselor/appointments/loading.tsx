export default function AppointmentsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="bg-primary pt-20 pb-10 px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-lg" />
            <div className="space-y-2">
              <div className="h-7 w-48 bg-white/20 rounded" />
              <div className="h-4 w-36 bg-white/15 rounded" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-6 lg:px-8 -mt-4 pb-12">
        <div className="bg-white rounded-xl h-12 border mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border h-24" />
          ))}
        </div>
      </div>
    </div>
  );
}
