'use client';

import React, { useState, useId } from 'react';
import { Dialog } from './ui/Dialog';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: 'project' | 'analysis';
  isLoading?: boolean;
}

export const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  itemName,
  itemType,
  isLoading = false,
}) => {
  const [confirmName, setConfirmName] = useState('');
  const isNameMatch = confirmName.trim() === itemName.trim();
  const canDelete = isNameMatch && !isLoading;

  const confirmInputId = useId();
  const descriptionId = useId();

  const handleConfirm = () => {
    if (canDelete) {
      onConfirm();
      setConfirmName('');
    }
  };

  const handleClose = () => {
    setConfirmName('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={`Delete ${itemType === 'project' ? 'Project' : 'Analysis'}`}
      aria-labelledby="dialog-title"
      aria-describedby={descriptionId}
    >
      <div className="space-y-4">
        <div id={descriptionId}>
          <p className="text-gray-700 mb-2">
            Are you sure you want to delete <strong className="font-semibold">{itemName}</strong>?
          </p>
          <p className="text-sm text-red-600 font-medium mb-4">
            ⚠️ This action cannot be undone. All data will be permanently deleted.
          </p>
        </div>

        <div>
          <Input
            id={confirmInputId}
            label={`Type "${itemName}" to confirm deletion`}
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={itemName}
            disabled={isLoading}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canDelete) {
                handleConfirm();
              }
            }}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            disabled={!canDelete}
            isLoading={isLoading}
            aria-label={`Permanently delete ${itemName}`}
          >
            Delete Permanently
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

