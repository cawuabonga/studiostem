import React from 'react';

const AppLogo = ({ className, useAcronym = false }: { className?: string, useAcronym?: boolean }) => {
  const text = useAcronym ? 'MADI' : 'Módulo de Asignación Docente Integrado';
  
  return (
    <div className={`font-headline text-xl font-bold text-primary ${className}`}>
      {text}
    </div>
  );
};

export default AppLogo;
