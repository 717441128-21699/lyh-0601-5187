import { cn } from '../../utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  extra?: React.ReactNode;
  icon?: React.ReactNode;
  hoverable?: boolean;
}

export default function Card({ children, className, title, subtitle, extra, icon, hoverable }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-card border border-gray-100',
        hoverable && 'card-hover cursor-pointer',
        className
      )}
    >
      {(title || extra) && (
        <div className="flex items-start justify-between p-5 border-b border-gray-50">
          <div className="flex items-start gap-3">
            {icon && <div className="text-ocean-600 mt-0.5">{icon}</div>}
            <div>
              {title && <h3 className="font-serif font-semibold text-ink-900 text-base">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {extra}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
