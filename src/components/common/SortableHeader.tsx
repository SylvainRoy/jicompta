import type { SortDirection } from '@/hooks/useSortConfig';

interface SortableHeaderProps {
  label: string;
  column: string;
  currentColumn: string;
  currentDirection: SortDirection;
  onSort: (column: string) => void;
  className?: string;
}

export default function SortableHeader({
  label,
  column,
  currentColumn,
  currentDirection,
  onSort,
  className = '',
}: SortableHeaderProps) {
  const isActive = currentColumn === column;

  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 transition-colors ${className}`}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <span className="inline-flex flex-col leading-none">
          <svg
            className={`w-3 h-3 -mb-0.5 ${isActive && currentDirection === 'asc' ? 'text-blue-600' : 'text-gray-300'}`}
            viewBox="0 0 10 6"
            fill="currentColor"
          >
            <path d="M5 0L10 6H0z" />
          </svg>
          <svg
            className={`w-3 h-3 ${isActive && currentDirection === 'desc' ? 'text-blue-600' : 'text-gray-300'}`}
            viewBox="0 0 10 6"
            fill="currentColor"
          >
            <path d="M5 6L0 0h10z" />
          </svg>
        </span>
      </div>
    </th>
  );
}
