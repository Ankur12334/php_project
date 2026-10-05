export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-24 items-center justify-center text-sm font-semibold text-slate-500">
      {label}
    </div>
  );
}
