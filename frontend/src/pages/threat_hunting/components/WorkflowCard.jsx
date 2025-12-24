export function WorkflowCard({ step, title, description, children, isActive, isDisabled }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-lg border-2 transition-all ${
        isActive
          ? "border-blue-500 shadow-blue-100"
          : isDisabled
          ? "border-gray-200 opacity-60"
          : "border-gray-200"
      }`}
    >
      <div className={`px-6 py-4 border-b border-gray-200 ${isActive ? "bg-blue-50" : "bg-gray-50"}`}>
        <div className="flex items-center space-x-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
              isActive
                ? "bg-blue-600 text-white"
                : isDisabled
                ? "bg-gray-300 text-gray-500"
                : "bg-gray-400 text-white"
            }`}
          >
            {step}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          {isActive && (
            <div className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Đang hoạt động
            </div>
          )}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}