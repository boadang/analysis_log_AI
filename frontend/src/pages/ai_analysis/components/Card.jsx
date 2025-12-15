// src/components/ui/card.jsx
export function Card({ className = "", children }) {
  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function CardContent({ className = "", children }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

