import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode; // For CTA button/link
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, children }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 text-center flex flex-col items-center">
      <div className="text-5xl mb-4 text-gray-400">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm">{description}</p>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
};
