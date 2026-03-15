// src/components/ui/button.jsx
export function Button({
  variant = "default",
  className = "",
  children,
  ...props
}) {
  const variants = {
    default: "bg-black text-white hover:bg-gray-800",
    outline: "border border-gray-300 hover:bg-gray-100",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition ${
        variants[variant] || variants.default
      } ${className}`}
    >
      {children}
    </button>
  );
}
