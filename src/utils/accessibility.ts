// Accessibility utilities and helpers

// ARIA live region announcer
class AriaAnnouncer {
  private static instance: AriaAnnouncer;
  private container: HTMLDivElement | null = null;

  static getInstance(): AriaAnnouncer {
    if (!AriaAnnouncer.instance) {
      AriaAnnouncer.instance = new AriaAnnouncer();
    }
    return AriaAnnouncer.instance;
  }

  private constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (typeof document === 'undefined') return;

    this.container = document.createElement('div');
    this.container.setAttribute('role', 'status');
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-atomic', 'true');
    this.container.className = 'sr-only';
    this.container.style.position = 'absolute';
    this.container.style.left = '-10000px';
    this.container.style.width = '1px';
    this.container.style.height = '1px';
    this.container.style.overflow = 'hidden';
    document.body.appendChild(this.container);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.container) return;

    this.container.setAttribute('aria-live', priority);
    this.container.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      if (this.container) {
        this.container.textContent = '';
      }
    }, 1000);
  }

  destroy(): void {
    if (this.container && document.body.contains(this.container)) {
      document.body.removeChild(this.container);
      this.container = null;
    }
  }
}

export const announcer = AriaAnnouncer.getInstance();

// Keyboard navigation helpers
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

export type KeyboardKey = typeof KeyboardKeys[keyof typeof KeyboardKeys];

// Focus management
export class FocusManager {
  private static focusableSelectors = [
    'a[href]',
    'area[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'audio[controls]',
    'video[controls]',
    '[contenteditable]:not([contenteditable="false"])',
    'details>summary:first-of-type',
    'details',
  ];

  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = this.focusableSelectors.join(',');
    return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
    );
  }

  static trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== KeyboardKeys.TAB) return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstFocusable?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  static restoreFocus(element: HTMLElement | null): void {
    if (element && typeof element.focus === 'function') {
      element.focus();
    }
  }

  static moveFocus(
    elements: HTMLElement[],
    currentIndex: number,
    direction: 'next' | 'previous' | 'first' | 'last'
  ): number {
    let newIndex = currentIndex;

    switch (direction) {
      case 'next':
        newIndex = (currentIndex + 1) % elements.length;
        break;
      case 'previous':
        newIndex = (currentIndex - 1 + elements.length) % elements.length;
        break;
      case 'first':
        newIndex = 0;
        break;
      case 'last':
        newIndex = elements.length - 1;
        break;
    }

    elements[newIndex]?.focus();
    return newIndex;
  }
}

// Skip links for keyboard navigation
export function createSkipLink(targetId: string, text: string = 'Skip to main content'): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = `#${targetId}`;
  link.className = 'skip-link';
  link.textContent = text;
  link.style.cssText = `
    position: absolute;
    left: -9999px;
    z-index: 999;
    padding: 1em;
    background-color: #000;
    color: #fff;
    text-decoration: none;
  `;

  link.addEventListener('focus', () => {
    link.style.left = '50%';
    link.style.transform = 'translateX(-50%)';
  });

  link.addEventListener('blur', () => {
    link.style.left = '-9999px';
    link.style.transform = 'none';
  });

  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.tabIndex = -1;
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });

  return link;
}

// ARIA attributes helper
export interface AriaAttributes {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  hidden?: boolean;
  expanded?: boolean;
  selected?: boolean;
  checked?: boolean | 'mixed';
  pressed?: boolean | 'mixed';
  current?: boolean | 'page' | 'step' | 'location' | 'date' | 'time';
  live?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: string;
  busy?: boolean;
  disabled?: boolean;
  invalid?: boolean | 'grammar' | 'spelling';
  required?: boolean;
  readonly?: boolean;
  multiline?: boolean;
  multiselectable?: boolean;
  orientation?: 'horizontal' | 'vertical';
  sort?: 'ascending' | 'descending' | 'none' | 'other';
  valueMin?: number;
  valueMax?: number;
  valueNow?: number;
  valueText?: string;
  setSize?: number;
  posInSet?: number;
  level?: number;
  colCount?: number;
  colIndex?: number;
  colSpan?: number;
  rowCount?: number;
  rowIndex?: number;
  rowSpan?: number;
  controls?: string;
  owns?: string;
  flowTo?: string;
  haspopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  autocomplete?: 'inline' | 'list' | 'both' | 'none';
  keyshortcuts?: string;
  roledescription?: string;
}

export function buildAriaAttributes(attrs: AriaAttributes): Record<string, any> {
  const result: Record<string, any> = {};

  if (attrs.label) result['aria-label'] = attrs.label;
  if (attrs.labelledBy) result['aria-labelledby'] = attrs.labelledBy;
  if (attrs.describedBy) result['aria-describedby'] = attrs.describedBy;
  if (attrs.hidden !== undefined) result['aria-hidden'] = attrs.hidden;
  if (attrs.expanded !== undefined) result['aria-expanded'] = attrs.expanded;
  if (attrs.selected !== undefined) result['aria-selected'] = attrs.selected;
  if (attrs.checked !== undefined) result['aria-checked'] = attrs.checked;
  if (attrs.pressed !== undefined) result['aria-pressed'] = attrs.pressed;
  if (attrs.current !== undefined) result['aria-current'] = attrs.current;
  if (attrs.live) result['aria-live'] = attrs.live;
  if (attrs.atomic !== undefined) result['aria-atomic'] = attrs.atomic;
  if (attrs.relevant) result['aria-relevant'] = attrs.relevant;
  if (attrs.busy !== undefined) result['aria-busy'] = attrs.busy;
  if (attrs.disabled !== undefined) result['aria-disabled'] = attrs.disabled;
  if (attrs.invalid !== undefined) result['aria-invalid'] = attrs.invalid;
  if (attrs.required !== undefined) result['aria-required'] = attrs.required;
  if (attrs.readonly !== undefined) result['aria-readonly'] = attrs.readonly;
  if (attrs.multiline !== undefined) result['aria-multiline'] = attrs.multiline;
  if (attrs.multiselectable !== undefined) result['aria-multiselectable'] = attrs.multiselectable;
  if (attrs.orientation) result['aria-orientation'] = attrs.orientation;
  if (attrs.sort) result['aria-sort'] = attrs.sort;
  if (attrs.valueMin !== undefined) result['aria-valuemin'] = attrs.valueMin;
  if (attrs.valueMax !== undefined) result['aria-valuemax'] = attrs.valueMax;
  if (attrs.valueNow !== undefined) result['aria-valuenow'] = attrs.valueNow;
  if (attrs.valueText) result['aria-valuetext'] = attrs.valueText;
  if (attrs.setSize !== undefined) result['aria-setsize'] = attrs.setSize;
  if (attrs.posInSet !== undefined) result['aria-posinset'] = attrs.posInSet;
  if (attrs.level !== undefined) result['aria-level'] = attrs.level;
  if (attrs.colCount !== undefined) result['aria-colcount'] = attrs.colCount;
  if (attrs.colIndex !== undefined) result['aria-colindex'] = attrs.colIndex;
  if (attrs.colSpan !== undefined) result['aria-colspan'] = attrs.colSpan;
  if (attrs.rowCount !== undefined) result['aria-rowcount'] = attrs.rowCount;
  if (attrs.rowIndex !== undefined) result['aria-rowindex'] = attrs.rowIndex;
  if (attrs.rowSpan !== undefined) result['aria-rowspan'] = attrs.rowSpan;
  if (attrs.controls) result['aria-controls'] = attrs.controls;
  if (attrs.owns) result['aria-owns'] = attrs.owns;
  if (attrs.flowTo) result['aria-flowto'] = attrs.flowTo;
  if (attrs.haspopup !== undefined) result['aria-haspopup'] = attrs.haspopup;
  if (attrs.autocomplete) result['aria-autocomplete'] = attrs.autocomplete;
  if (attrs.keyshortcuts) result['aria-keyshortcuts'] = attrs.keyshortcuts;
  if (attrs.roledescription) result['aria-roledescription'] = attrs.roledescription;

  return result;
}

// Color contrast checker
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (color: string): number => {
    const rgb = color.match(/\d+/g);
    if (!rgb || rgb.length < 3) return 0;

    const [r, g, b] = rgb.map((c) => {
      const val = parseInt(c) / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsWCAGAAA(contrastRatio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7;
}

export function meetsWCAGAA(contrastRatio: number, isLargeText: boolean = false): boolean {
  return isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5;
}

// Reduced motion preference
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// High contrast mode detection
export function isHighContrastMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: high)').matches;
}

// Screen reader detection (limited reliability)
export function isScreenReaderActive(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for common screen reader indicators
  return !!(
    (window as any).speechSynthesis ||
    document.body.getAttribute('aria-hidden') === 'false' ||
    navigator.userAgent.includes('NVDA') ||
    navigator.userAgent.includes('JAWS')
  );
}

// Semantic HTML role mapping
export const semanticRoles = {
  navigation: 'nav',
  main: 'main',
  complementary: 'aside',
  contentinfo: 'footer',
  banner: 'header',
  search: 'search',
  form: 'form',
  region: 'section',
  article: 'article',
} as const;

// Focus visible polyfill helper
export function applyFocusVisiblePolyfill(): void {
  if (typeof document === 'undefined') return;

  // Check if :focus-visible is supported
  try {
    document.querySelector(':focus-visible');
  } catch {
    // Apply polyfill
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-nav');
    });
  }
}

// Language direction helper
export function getTextDirection(lang: string = 'en'): 'ltr' | 'rtl' {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'yi', 'ji', 'iw', 'ku', 'ms', 'ml'];
  const primaryLang = lang.split('-')[0].toLowerCase();
  return rtlLanguages.includes(primaryLang) ? 'rtl' : 'ltr';
}