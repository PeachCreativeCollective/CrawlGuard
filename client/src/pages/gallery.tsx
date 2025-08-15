import { useState } from "react";
import { SEOHead } from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";
import cg1Image from "@assets/CG1_1755280257030.webp";
import cg2Image from "@assets/CG2_1755280257030.webp";
import cg3Image from "@assets/CG3_1755280257029.webp";
import cg4Image from "@assets/CG4_1755280257029.webp";
import cg5Image from "@assets/CG5_1755280257029.webp";
import cg6Image from "@assets/CG6_1755280257028.webp";
import cg7Image from "@assets/CG7_1755280257028.webp";
import cg8Image from "@assets/CG8_1755280257028.webp";
import cg9Image from "@assets/CG9_1755280257027.webp";
import cg10Image from "@assets/CG10_1755280257026.webp";

// Gallery images with proper categorization - Real CrawlGuard LLC project photos
const galleryImages = [
  {
    id: 1,
    src: cg1Image,
    alt: "CrawlGuard LLC crawl space encapsulation showing complete vapor barrier installation with HVAC system",
    title: "Complete Crawl Space Encapsulation",
    description: "Professional vapor barrier installation with sealed HVAC integration",
    category: "crawl-space"
  },
  {
    id: 2,
    src: cg2Image,
    alt: "Foundation waterproofing and exterior drainage work around brick foundation",
    title: "Foundation Protection",
    description: "Exterior foundation waterproofing and drainage solutions",
    category: "foundation"
  },
  {
    id: 3,
    src: cg3Image,
    alt: "Crawl space with professional vapor barrier installation and structural support posts",
    title: "Vapor Barrier System",
    description: "High-quality moisture barrier with structural integrity protection",
    category: "crawl-space"
  },
  {
    id: 4,
    src: cg4Image,
    alt: "Basement waterproofing showing moisture barrier installation around utilities",
    title: "Basement Moisture Control",
    description: "Professional basement waterproofing with utility protection",
    category: "basement"
  },
  {
    id: 5,
    src: cg5Image,
    alt: "Crawl space showing completed moisture barrier installation with ventilation system",
    title: "Professional Encapsulation",
    description: "Complete crawl space sealing with ventilation integration",
    category: "crawl-space"
  },
  {
    id: 6,
    src: cg6Image,
    alt: "Sump pump installation in basement for water removal and flood prevention",
    title: "Sump Pump Installation",
    description: "Professional sump pump system for water management",
    category: "drainage"
  },
  {
    id: 7,
    src: cg7Image,
    alt: "French drain installation with gravel bed for foundation water diversion",
    title: "French Drain System",
    description: "Professional drainage system installation with gravel bed",
    category: "drainage"
  },
  {
    id: 8,
    src: cg8Image,
    alt: "Crawl space before waterproofing showing moisture issues and structural concerns",
    title: "Before Treatment",
    description: "Crawl space showing moisture damage before CrawlGuard treatment",
    category: "crawl-space"
  },
  {
    id: 9,
    src: cg9Image,
    alt: "Completed crawl space encapsulation showing dry, clean space with structural posts",
    title: "After Treatment",
    description: "Transformed crawl space with complete moisture protection",
    category: "crawl-space"
  },
  {
    id: 10,
    src: cg10Image,
    alt: "Professional dehumidification system installed in crawl space for moisture control",
    title: "Dehumidification System",
    description: "Advanced moisture control with professional dehumidifier installation",
    category: "crawl-space"
  }
];

const categories = [
  { id: "all", name: "All Projects" },
  { id: "crawl-space", name: "Crawl Space" },
  { id: "basement", name: "Basement" },
  { id: "foundation", name: "Foundation" },
  { id: "drainage", name: "Drainage" }
];

export default function Gallery() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedImage, setSelectedImage] = useState<typeof galleryImages[0] | null>(null);

  const filteredImages = selectedCategory === "all" 
    ? galleryImages 
    : galleryImages.filter(image => image.category === selectedCategory);

  return (
    <>
      <SEOHead
        title="Project Gallery - CrawlGuard LLC Waterproofing Work in Asheville, NC"
        description="View our waterproofing project gallery showcasing crawl space encapsulation, basement waterproofing, and foundation protection work in Asheville, NC."
        keywords="waterproofing gallery, before after photos, crawl space projects, basement waterproofing examples, Asheville NC"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-crawlguard-primary/10 to-blue-50 py-20" data-testid="gallery-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-crawlguard-dark mb-6" data-testid="gallery-hero-title">
            See Our Work
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="gallery-hero-description">
            Browse our photo gallery to see the difference professional waterproofing can make for homes 
            throughout Asheville and Western North Carolina.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-white border-b" data-testid="gallery-filter">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id 
                  ? "bg-crawlguard-primary hover:bg-crawlguard-primary/90 text-white" 
                  : "border-crawlguard-primary text-crawlguard-primary hover:bg-crawlguard-primary hover:text-white"
                }
                data-testid={`filter-${category.id}`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-20 bg-crawlguard-light" data-testid="gallery-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredImages.map((image) => (
              <Dialog key={image.id}>
                <DialogTrigger asChild>
                  <div 
                    className="group cursor-pointer"
                    onClick={() => setSelectedImage(image)}
                    data-testid={`gallery-image-${image.id}`}
                  >
                    <img 
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-64 object-cover rounded-lg shadow-md group-hover:shadow-xl transition-shadow"
                      data-testid={`image-${image.id}`}
                    />
                    <div className="mt-3">
                      <h3 className="font-semibold text-crawlguard-dark" data-testid={`title-${image.id}`}>
                        {image.title}
                      </h3>
                      <p className="text-gray-600 text-sm" data-testid={`description-${image.id}`}>
                        {image.description}
                      </p>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh]" data-testid={`modal-${image.id}`}>
                  <div className="space-y-4">
                    <img 
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                    />
                    <div>
                      <h3 className="text-xl font-semibold text-crawlguard-dark">
                        {image.title}
                      </h3>
                      <p className="text-gray-600">{image.description}</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button 
              asChild
              size="lg"
              className="bg-crawlguard-primary hover:bg-crawlguard-primary/90 text-white font-semibold"
              data-testid="gallery-cta"
            >
              <Link href="/contact">View More Projects</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Before/After Section */}
      <section className="py-20 bg-white" data-testid="before-after-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-crawlguard-dark mb-4" data-testid="before-after-title">
              The CrawlGuard Difference
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto" data-testid="before-after-description">
              See the dramatic transformation our waterproofing solutions provide
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-crawlguard-dark" data-testid="transformation-title">
                Complete Home Protection
              </h3>
              <div className="space-y-4">
                {[
                  "Eliminates moisture and humidity issues",
                  "Prevents mold and mildew growth", 
                  "Improves indoor air quality",
                  "Increases energy efficiency",
                  "Protects structural integrity",
                  "Adds value to your home"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3" data-testid={`benefit-${index}`}>
                    <svg className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                    <span className="text-gray-600">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img 
                src={cg9Image}
                alt="Completed CrawlGuard waterproofing project showing protected crawl space"
                className="rounded-xl shadow-lg w-full h-auto"
                data-testid="transformation-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-crawlguard-primary to-teal-600 text-white" data-testid="gallery-cta-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" data-testid="gallery-cta-title">
            Ready for Your Transformation?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto" data-testid="gallery-cta-description">
            Let us protect your home with the same quality workmanship shown in our gallery. 
            Contact us today for your free consultation.
          </p>
          <Button 
            asChild
            size="lg"
            className="bg-crawlguard-secondary hover:bg-red-600 text-white font-semibold"
            data-testid="gallery-cta-button"
          >
            <Link href="/contact">Get Your Free Estimate</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
