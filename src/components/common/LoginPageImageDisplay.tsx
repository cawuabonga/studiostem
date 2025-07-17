
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getInstituteLoginPageImage } from "@/config/firebase";

const DEFAULT_IMAGE_URL = "https://placehold.co/600x700.png";
const DEFAULT_AI_HINT = "login graphic";

interface LoginPageImageDisplayProps {
  imageUrl?: string | null;
}

export function LoginPageImageDisplay({ imageUrl: propImageUrl }: LoginPageImageDisplayProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(propImageUrl ?? null);
  const [loading, setLoading] = useState(!propImageUrl);

  useEffect(() => {
    // Only fetch if no image is passed via props
    if (propImageUrl === undefined) {
      async function fetchImageUrl() {
        setLoading(true);
        try {
          const urlFromDB = await getInstituteLoginPageImage();
          setImageUrl(urlFromDB || DEFAULT_IMAGE_URL);
        } catch (error) {
          console.error("Error fetching login page image URL:", error);
          setImageUrl(DEFAULT_IMAGE_URL); // Fallback to default
        } finally {
          setLoading(false);
        }
      }
      fetchImageUrl();
    } else {
        setImageUrl(propImageUrl);
        setLoading(false);
    }
  }, [propImageUrl]);

  if (loading) {
    return (
      <div className="p-1 h-full flex items-center justify-center">
        <Skeleton className="w-full h-[400px] md:w-[600px] md:h-[700px]" />
      </div>
    );
  }

  const finalImageUrl = imageUrl || DEFAULT_IMAGE_URL;

  return (
    <div className="p-1 h-full w-full">
      <Card className="overflow-hidden h-full shadow-lg">
        <CardContent className="flex h-full items-center justify-center p-0">
          <Image
            src={finalImageUrl}
            alt="Imagen Institucional"
            width={600}
            height={700}
            className="object-cover w-full h-full"
            data-ai-hint={finalImageUrl === DEFAULT_IMAGE_URL ? DEFAULT_AI_HINT : "custom login-graphic"}
            priority
          />
        </CardContent>
      </Card>
    </div>
  );
}
