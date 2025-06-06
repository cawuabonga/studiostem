import React from 'react';

const AppLogo = ({ className }: { className?: string }) => {
  return (
    <div className={`font-headline text-3xl font-bold text-primary ${className}`}>
      CAP FAP Connect
    </div>
  );
};

export default AppLogo;
