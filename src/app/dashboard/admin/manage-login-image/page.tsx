
"use client";

import { UpdateLoginImageForm } from "@/components/admin/UpdateLoginImageForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ManageLoginImagePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Admin')) {
      router.push('/dashboard'); // Redirect if not admin or not logged in
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'Admin') {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading or unauthorized...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Manage Login Page Image</CardTitle>
          <CardDescription>
            Update the image displayed on the login and registration pages.
            Enter a valid image URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpdateLoginImageForm />
        </CardContent>
      </Card>
    </div>
  );
}
