
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getLoginPageImageURL } from "@/config/firebase"; 
import { useAuth } from "@/contexts/AuthContext";

const DEFAULT_IMAGE_URL = "https://placehold.co/600x700.png";
const DEFAULT_AI_HINT = "login graphic";

export function LoginPageImageDisplay() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { instituteId } = useAuth(); // Use a mock or default for login page

  useEffect(() => {
    async function fetchImageUrl() {
      // On the login page, we don't have a selected institute yet.
      // This is a placeholder for a more complex institute detection logic.
      const instituteForLoginPage = instituteId || 'istp-principal'; 

      setLoading(true);
      try {
        const urlFromDB = await getLoginPageImageURL(instituteForLoginPage);
        setImageUrl(urlFromDB || DEFAULT_IMAGE_URL);
      } catch (error) {
        console.error("Error fetching login page image URL:", error);
        setImageUrl(DEFAULT_IMAGE_URL); // Fallback to default
      } finally {
        setLoading(false);
      }
    }
    fetchImageUrl();
  }, [instituteId]);

  if (loading) {
    return (
      <div className="p-1 h-full flex items-center justify-center">
        <Skeleton className="w-[600px] h-[700px]" />
      </div>
    );
  }

  return (
    <div className="p-1 h-full">
      <Card className="overflow-hidden h-full shadow-lg">
        <CardContent className="flex h-full items-center justify-center p-0">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt="Imagen Institucional"
              width={600}
              height={700}
              className="object-cover w-full h-full"
              data-ai-hint={imageUrl === DEFAULT_IMAGE_URL ? DEFAULT_AI_HINT : "custom login-graphic"}
              priority
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
