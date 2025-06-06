"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function WelcomeMessage() {
  const { user } = useAuth();

  if (!user) {
    return null; 
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="items-center text-center">
        <Avatar className="w-24 h-24 mb-4">
          <AvatarImage src={user.photoURL || `https://placehold.co/100x100.png?text=${user.displayName?.[0] || 'U'}`} alt={user.displayName || "User avatar"} data-ai-hint="profile avatar" />
          <AvatarFallback className="text-3xl">{user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-3xl font-headline">Welcome, {user.displayName || 'User'}!</CardTitle>
        <CardDescription className="text-lg">
          You are logged in as a <span className="font-semibold text-primary">{user.role}</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-muted-foreground">
          This is your dashboard. Future updates and specific functionalities for your role will appear here.
        </p>
        {/* Placeholder for future content based on role */}
        {user.role === 'Admin' && (
          <p className="mt-4 text-center text-sm text-accent-foreground bg-accent/20 p-2 rounded-md">
            Admin-specific tools and options will be available here.
          </p>
        )}
         {user.role === 'Teacher' && (
          <p className="mt-4 text-center text-sm">
            Access your courses, student submissions, and grading tools.
          </p>
        )}
         {user.role === 'Student' && (
          <p className="mt-4 text-center text-sm">
            View your enrolled courses, assignments, and grades.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
