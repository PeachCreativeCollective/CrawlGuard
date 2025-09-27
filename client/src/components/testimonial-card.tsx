import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, Star } from "lucide-react";

interface TestimonialCardProps {
  name: string;
  location: string;
  rating: number;
  text: string;
  sourceLabel?: string;
  sourceUrl?: string;
}

export function TestimonialCard({ name, location, rating, text, sourceLabel, sourceUrl }: TestimonialCardProps) {
  return (
    <Card className="bg-crawlguard-light shadow-sm h-full" data-testid={`testimonial-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-8">
        <div className="flex items-center mb-4">
          <div className="flex text-yellow-400 mr-2" data-testid="rating-stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${i < rating ? "fill-current" : "text-gray-300"}`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600" data-testid="rating-value">
            {rating.toFixed(1)}
          </span>
        </div>
        <p className="text-gray-600 mb-6" data-testid="testimonial-text">
          "{text}"
        </p>
        <div className="border-t pt-4 space-y-2">
          <div className="font-semibold text-crawlguard-dark" data-testid="testimonial-name">
            {name}
          </div>
          <div className="text-sm text-gray-600" data-testid="testimonial-location">
            {location}
          </div>
          {sourceLabel && sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-crawlguard-primary font-semibold text-sm hover:underline"
              data-testid="testimonial-source"
            >
              {sourceLabel}
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
