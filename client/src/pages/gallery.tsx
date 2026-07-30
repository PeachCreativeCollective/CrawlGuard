import { useState } from "react";
import { SEOHead } from "@/components/seo-head";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";
import { Facebook } from "lucide-react";
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
  },
  {
    id: 11,
    src: "https://cdn.builder.io/api/v1/image/assets/34bf9dd4adbe478f9667d57bf160df89/c32aeb85993b4310a79bf856b55a127b?format=jpg&width=800&height=1200",
    alt: "CrawlGuard crawl space encapsulation project",
    title: "Crawl Space Encapsulation",
    description: "Moisture-protected crawl space with a sealed vapor barrier",
    category: "crawl-space"
  },
  {
    id: 12,
    src: "https://cdn.builder.io/api/v1/image/assets/34bf9dd4adbe478f9667d57bf160df89/d881659c4ceb4e4abdc731e79b8bea39?format=jpg&width=800&height=1200",
    alt: "CrawlGuard crawl space waterproofing project",
    title: "Encapsulation Project",
    description: "Completed crawl space moisture control installation",
    category: "crawl-space"
  },
  {
    id: 13,
    src: "https://cdn.builder.io/api/v1/image/assets/34bf9dd4adbe478f9667d57bf160df89/115ea431186d4e2d99dc608fc254f8b4?format=jpg&width=800&height=1200",
    alt: "CrawlGuard crawl space with sealed walls and insulated ductwork",
    title: "Sealed Crawl Space",
    description: "Finished crawl space with sealed walls and protected ductwork",
    category: "crawl-space"
  },
  {
    id: 14,
    src: "https://cdn.builder.io/api/v1/image/assets/34bf9dd4adbe478f9667d57bf160df89/eacf3b9d2c914773aa0d8b169eb0c7df?format=jpg&width=800&height=1200",
    alt: "CrawlGuard crawl space encapsulation with HVAC equipment",
    title: "HVAC-Ready Encapsulation",
    description: "Clean encapsulated space surrounding HVAC and drainage systems",
    category: "crawl-space"
  },
  {
    id: 15,
    src: "https://cdn.builder.io/api/v1/image/assets/34bf9dd4adbe478f9667d57bf160df89/ce4b811478bb46e399dc91c10ca483fe?format=jpg&width=800&height=1200",
    alt: "CrawlGuard wide crawl space encapsulation project",
    title: "Full Crawl Space Protection",
    description: "Wide-view project photo showing continuous floor and wall coverage",
    category: "crawl-space"
  },
  {
    id: 16,
    src: "https://cdn.builder.io/api/v1/image/assets/34bf9dd4adbe478f9667d57bf160df89/a4886367430f431e96fcbbdffab7971b?format=jpg&width=800&height=1200",
    alt: "CrawlGuard finished crawl space vapor barrier installation",
    title: "Finished Vapor Barrier",
    description: "Completed vapor barrier installation across the crawl space",
    category: "crawl-space"
  }
];

const featuredFacebookReels = [
  { id: "1062278912803305", embedUrl: "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1062278912803305&show_text=false&width=500" },
  { id: "1517118753181746", embedUrl: "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F1517118753181746&show_text=false&width=500" },
  { id: "954581030771601", embedUrl: "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F954581030771601&show_text=false&width=500" },
  { id: "912295750875837", embedUrl: "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F912295750875837&show_text=false&width=500" },
];
const transformationVideoEmbedUrl = "https://www.youtube.com/embed/tBGqj22J7FI?rel=0";

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
  const [showAllImages, setShowAllImages] = useState(false);

  const filteredImages = selectedCategory === "all"
    ? galleryImages
    : galleryImages.filter(image => image.category === selectedCategory);
  const displayedImages = showAllImages ? filteredImages : filteredImages.slice(0, 9);

  return (
    <>
      <SEOHead
        title="Project Gallery - CrawlGuard LLC Waterproofing Work in Asheville, NC"
        description="View our waterproofing project gallery showcasing crawl space encapsulation, basement waterproofing, and foundation protection work in Asheville, NC."
        keywords="waterproofing gallery, before after photos, crawl space projects, basement waterproofing examples, Asheville NC"
        canonicalUrl="https://crawlguardllc.com/gallery"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-crawlguard-primary/10 to-blue-50 py-6 md:py-20" data-testid="gallery-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-crawlguard-dark mb-2 md:mb-6" data-testid="gallery-hero-title">
            See Our Work
          </h1>
          <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto" data-testid="gallery-hero-description">
            Browse our photo gallery to see the difference professional waterproofing can make for homes 
            throughout Asheville and Western North Carolina.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-4 md:py-8 bg-white border-b" data-testid="gallery-filter">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-5 gap-1 sm:flex sm:flex-wrap sm:justify-center sm:gap-4">
            {categories.map((category) => {
              const isSelected = selectedCategory === category.id;

              return (
                <Button
                  key={category.id}
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setShowAllImages(false);
                  }}
                  aria-pressed={isSelected}
                  className={`h-auto min-h-9 w-full whitespace-normal rounded-lg px-1 py-1.5 text-center text-[11px] leading-tight sm:h-12 sm:w-auto sm:px-5 sm:py-2 sm:text-sm ${isSelected
                    ? "bg-crawlguard-primary text-white hover:bg-crawlguard-primary/90"
                    : "border-crawlguard-primary bg-white text-crawlguard-primary hover:bg-crawlguard-primary hover:text-white"
                  }`}
                  data-testid={`filter-${category.id}`}
                >
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-6 md:py-20 bg-crawlguard-light" data-testid="gallery-grid">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 md:mb-10">
            <h2 className="text-2xl md:text-4xl font-bold text-crawlguard-dark">Project Photos</h2>
            <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">Browse completed CrawlGuard waterproofing and encapsulation projects.</p>
          </div>
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {displayedImages.map((image) => (
              <Dialog key={image.id}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="group w-[82vw] max-w-[340px] shrink-0 snap-center text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crawlguard-primary focus-visible:ring-offset-4 rounded-lg sm:w-full sm:max-w-none"
                    onClick={() => setSelectedImage(image)}
                    data-testid={`gallery-image-${image.id}`}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="aspect-[4/3] w-full object-cover rounded-lg shadow-md transition-shadow group-hover:shadow-xl sm:aspect-auto sm:h-64"
                      data-testid={`image-${image.id}`}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="mt-3">
                      <h3 className="font-semibold text-crawlguard-dark" data-testid={`title-${image.id}`}>
                        {image.title}
                      </h3>
                      <p className="text-gray-600 text-sm" data-testid={`description-${image.id}`}>
                        {image.description}
                      </p>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh]" data-testid={`modal-${image.id}`}>
                  <div className="space-y-4">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                      loading="lazy"
                      decoding="async"
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

          {filteredImages.length > 9 && (
            <div className="text-center mt-12">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowAllImages((isShowingAll) => !isShowingAll)}
                className="border-crawlguard-primary text-crawlguard-primary hover:bg-crawlguard-primary hover:text-white"
                data-testid="gallery-view-more"
              >
                {showAllImages ? "Show Fewer Photos" : "View More Photos"}
              </Button>
            </div>
          )}

          <div className="text-center mt-6">
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

      <section className="py-16 bg-crawlguard-dark text-white" data-testid="featured-reels-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 text-crawlguard-primary font-semibold uppercase tracking-[0.2em] text-sm mb-4">
                <Facebook className="h-5 w-5" aria-hidden="true" />
                <span>Featured Reels</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold" data-testid="featured-reels-title">
                See CrawlGuard in Action
              </h2>
            </div>
            <p className="text-white/70 max-w-md md:text-right">
              Watch real project updates and waterproofing tips from the CrawlGuard team.
            </p>
          </div>

          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {featuredFacebookReels.map((reel, index) => (
              <article
                key={reel.id}
                className="w-[78vw] max-w-[300px] shrink-0 snap-center sm:w-full sm:max-w-[280px] sm:justify-self-center"
                data-testid={`gallery-video-${index + 1}`}
              >
                <div className="overflow-hidden rounded-2xl bg-black shadow-xl ring-1 ring-white/10">
                  <iframe
                    src={reel.embedUrl}
                    title={`CrawlGuard LLC Facebook Reel ${index + 1}`}
                    className="block aspect-[9/16] w-full"
                    scrolling="no"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </article>
            ))}
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
            <div className="mx-auto w-full max-w-md">
              <div className="overflow-hidden rounded-xl bg-black shadow-lg ring-1 ring-crawlguard-dark/10">
                <iframe
                  src={transformationVideoEmbedUrl}
                  title="CrawlGuard LLC YouTube video showing the CrawlGuard difference"
                  className="block aspect-video w-full"
                  scrolling="no"
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  data-testid="transformation-video"
                />
              </div>
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
