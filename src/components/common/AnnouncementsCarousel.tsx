
"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const announcements = [
  { id: 1, src: "https://placehold.co/600x400.png", alt: "Campus event", dataAiHint: "campus event" },
  { id: 2, src: "https://placehold.co/600x400.png", alt: "New course offering", dataAiHint: "education learning" },
  { id: 3, src: "https://placehold.co/600x400.png", alt: "Important deadline", dataAiHint: "deadline reminder" },
  { id: 4, src: "https://placehold.co/600x400.png", alt: "Student achievements", dataAiHint: "student achievement" },
];

export function AnnouncementsCarousel() {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  return (
    <Carousel
      plugins={[plugin.current]}
      className="w-full h-full" // Changed to h-full, removed max-w-xl
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
      opts={{
        loop: true,
        axis: "y", // Added for vertical orientation
      }}
      orientation="vertical" // Explicitly set orientation
    >
      <CarouselContent className="-mt-1 h-full"> {/* Added h-full for vertical layout */}
        {announcements.map((announcement) => (
          <CarouselItem key={announcement.id} className="pt-1 md:basis-full"> {/* Adjusted for vertical */}
            <div className="p-1 h-full">
              <Card className="overflow-hidden h-full">
                <CardContent className="flex h-full items-center justify-center p-0"> {/* Changed aspect-video to h-full */}
                  <Image
                    src={announcement.src}
                    alt={announcement.alt}
                    width={600} // Intrinsic width for aspect ratio
                    height={400} // Intrinsic height for aspect ratio
                    className="object-cover w-full h-full"
                    data-ai-hint={announcement.dataAiHint}
                  />
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      {/* Removed custom classNames from CarouselPrevious and CarouselNext to use ShadCN's vertical defaults */}
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
