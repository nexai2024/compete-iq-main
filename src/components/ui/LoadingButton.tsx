
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button, ButtonProps } from './Button';

export interface LoadingButtonProps extends ButtonProps {
  loadingText?: string;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ isLoading, loadingText, children, ...props }, ref) => {
    return (
      <Button ref={ref} disabled={isLoading} aria-busy={isLoading} {...props}>
        {isLoading ? (
          <>
            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
            {loadingText}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';
