export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Skeleton Sidebar */}
      <div className="w-64 bg-white border-r shadow-lg pt-24 h-screen overflow-y-auto hidden lg:block">
        <div className="p-4 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 px-4 py-3">
              <div className="w-5 h-5 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="w-32 h-4 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          ))}
          <div className="flex items-center space-x-3 px-4 py-3 mt-8">
            <div className="w-5 h-5 bg-gray-200 rounded-md animate-pulse"></div>
            <div className="w-24 h-4 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Skeleton Main Content */}
      <div className="flex-1 pt-24 pb-12 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Skeleton Header */}
          <div className="h-8 w-1/3 bg-gray-200 rounded-md animate-pulse mb-8"></div>

          {/* Skeleton Card */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-4">
              <div className="h-6 w-1/2 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-4 w-5/6 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="flex justify-end pt-4">
                <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
              </div>
            </div>
          </div>
          
          {/* Another Skeleton Card */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-4">
              <div className="h-6 w-1/3 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-4 w-full bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-4 w-full bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-4 w-1/2 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
