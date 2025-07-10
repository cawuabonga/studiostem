"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import React from 'react';

interface SignOutButtonProps extends ButtonProps {
  showIcon?: boolean;
  buttonText?: string;
}

export const SignOutButton: React.FC<SignOutButtonProps> = ({ className, showIcon = true, buttonText = "Cerrar Sesión", ...props }) => {
  const { signOutUser, loading } = useAuth();

  return (
    <Button
      variant="ghost"
      className={className}
      onClick={signOutUser}
      disabled={loading}
      {...props}
    >
      {showIcon && <LogOut className="mr-2 h-4 w-4" />}
      {buttonText}
    </Button>
  );
};
