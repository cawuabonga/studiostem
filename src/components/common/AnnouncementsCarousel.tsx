
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
// import Autoplay from "embla-carousel-autoplay"; // Temporarily removed

const announcements = [
  { id: 1, src: "https://placehold.co/600x700.png", alt: "Campus event", dataAiHint: "campus event" },
  { id: 2, src: "https://placehold.co/600x700.png", alt: "New course offering", dataAiHint: "education learning" },
  { id: 3, src: "https://placehold.co/600x700.png", alt: "Important deadline", dataAiHint: "deadline reminder" },
  { id: 4, src: "https://placehold.co/600x700.png", alt: "Student achievements", dataAiHint: "student achievement" },
];

export function AnnouncementsCarousel() {
  // const plugin = React.useRef(
  //   Autoplay({ delay: 3000, stopOnInteraction: true })
  // );

  return (
    <Carousel
      // plugins={[plugin.current]} // Temporarily removed
      className="w-full h-full"
      // onMouseEnter={plugin.current.stop} // Temporarily removed
      // onMouseLeave={plugin.current.reset} // Temporarily removed
      opts={{
        // loop: true, // Temporarily removed
        axis: "y",
      }}
      orientation="vertical"
    >
      <CarouselContent className="-mt-1 h-full">
        {announcements.map((announcement) => (
          <CarouselItem key={announcement.id} className="pt-1 basis-full">
            <div className="p-1 h-full">
              <Card className="overflow-hidden h-full">
                <CardContent className="flex h-full items-center justify-center p-0">
                  <Image
                    src={announcement.src}
                    alt={announcement.alt}
                    width={600}
                    height={700}
                    className="object-cover w-full h-full"
                    data-ai-hint={announcement.dataAiHint}
                    priority={announcement.id === 1}
                  />
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
