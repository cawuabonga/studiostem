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
      className="w-full max-w-xl"
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
      opts={{
        loop: true,
      }}
    >
      <CarouselContent>
        {announcements.map((announcement) => (
          <CarouselItem key={announcement.id}>
            <div className="p-1">
              <Card className="overflow-hidden">
                <CardContent className="flex aspect-video items-center justify-center p-0">
                  <Image
                    src={announcement.src}
                    alt={announcement.alt}
                    width={600}
                    height={400}
                    className="object-cover w-full h-full"
                    data-ai-hint={announcement.dataAiHint}
                  />
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
      <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
    </Carousel>
  );
}
