export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-20 animate-pulse">
      <div className="h-8 w-1/2 bg-gray-200 mb-4 rounded"></div>
      <div className="h-4 w-2/3 bg-gray-200 mb-12 rounded"></div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 w-3/4 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 w-1/2 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
