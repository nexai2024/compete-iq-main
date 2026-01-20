import React, { useEffect } from 'react';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  ariaDescribedBy?: string;
}

export const Dialog: React.FC<DialogProps> = ({ open, onClose, title, children, ariaDescribedBy }) => {
  useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // Prevent body scroll when dialog is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={ariaDescribedBy}
      >
        <div className="p-6">
          <h2 id="dialog-title" className="text-xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          {children}
        </div>
      </div>
    </div>
  );
};

