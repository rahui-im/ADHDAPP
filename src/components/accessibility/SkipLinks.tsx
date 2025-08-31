import React from 'react';

interface SkipLink {
  id: string;
  text: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
}

const defaultLinks: SkipLink[] = [
  { id: 'main-content', text: 'Skip to main content' },
  { id: 'navigation', text: 'Skip to navigation' },
  { id: 'search', text: 'Skip to search' },
];

export const SkipLinks: React.FC<SkipLinksProps> = ({ links = defaultLinks }) => {
  return (
    <div className="skip-links">
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          onClick={(e) => {
            e.preventDefault();
            const target = document.getElementById(link.id);
            if (target) {
              target.tabIndex = -1;
              target.focus();
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
        >
          {link.text}
        </a>
      ))}
    </div>
  );
};

// Landmark component for better navigation
interface LandmarkProps {
  as?: 'main' | 'nav' | 'aside' | 'section' | 'article' | 'header' | 'footer';
  id?: string;
  label?: string;
  className?: string;
  children: React.ReactNode;
}

export const Landmark: React.FC<LandmarkProps> = ({
  as: Component = 'section',
  id,
  label,
  className = '',
  children,
}) => {
  return (
    <Component
      id={id}
      aria-label={label}
      className={className}
      tabIndex={-1}
    >
      {children}
    </Component>
  );
};

// Breadcrumb navigation
interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  separator = '/',
}) => {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400" aria-hidden="true">
                {separator}
              </span>
            )}
            {item.href && !item.current ? (
              <a
                href={item.href}
                className="text-gray-600 hover:text-gray-900 hover:underline"
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </a>
            ) : (
              <span
                className={item.current ? 'text-gray-900 font-medium' : 'text-gray-600'}
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};