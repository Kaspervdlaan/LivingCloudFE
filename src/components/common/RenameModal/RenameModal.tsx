import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import './_RenameModal.scss';

interface RenameModalProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onConfirm: (newName: string) => void;
}

export function RenameModal({ isOpen, currentName, onClose, onConfirm }: RenameModalProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
    }
  }, [isOpen, currentName]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Rename</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal__body">
          <input
            type="text"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="Enter new name"
          />
          <div className="modal__actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

