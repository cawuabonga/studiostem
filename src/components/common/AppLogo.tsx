import React from 'react';

const AppLogo = ({ className, useAcronym = false }: { className?: string, useAcronym?: boolean }) => {
  const text = useAcronym ? 'STEM' : 'SISTEMA TECNOLOGICO DE EDUCACION MODULAR';
  
  return (
    <div className={`font-headline text-xl font-bold text-primary ${className}`}>
      {text}
    </div>
  );
};

export default AppLogo;
