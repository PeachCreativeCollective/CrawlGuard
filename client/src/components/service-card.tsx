import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
}

export function ServiceCard({ title, description, icon: Icon, href = "/services" }: ServiceCardProps) {
  return (
    <Card className="bg-crawlguard-light hover:shadow-lg transition-shadow h-full" data-testid={`service-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-8">
        <div className="w-16 h-16 bg-crawlguard-primary/10 rounded-lg flex items-center justify-center mb-6">
          <Icon className="w-8 h-8 text-crawlguard-primary" />
        </div>
        <h3 className="text-xl font-semibold text-crawlguard-dark mb-3" data-testid="service-title">
          {title}
        </h3>
        <p className="text-gray-600 mb-4" data-testid="service-description">
          {description}
        </p>
        <Link
          href={href}
          className="text-crawlguard-primary font-semibold hover:underline"
          data-testid="service-link"
        >
          Learn More →
        </Link>
      </CardContent>
    </Card>
  );
}
