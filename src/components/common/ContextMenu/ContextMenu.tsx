import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import './_ContextMenu.scss';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  children: ReactNode;
}

export function ContextMenu({ x, y, onClose, children }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position if menu would go off screen
  const adjustedX = x;
  const adjustedY = y;

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
    >
      {children}
    </div>
  );
}

interface ContextMenuItemProps {
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
}

export function ContextMenuItem({ onClick, children, danger = false }: ContextMenuItemProps) {
  return (
    <button
      className={`context-menu__item ${danger ? 'context-menu__item--danger' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

