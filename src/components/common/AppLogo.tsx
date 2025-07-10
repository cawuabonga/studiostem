import React from 'react';

const AppLogo = ({ className }: { className?: string }) => {
  return (
    <div className={`font-headline text-3xl font-bold text-primary ${className}`}>
      SA-NM-50
    </div>
  );
};

export default AppLogo;
