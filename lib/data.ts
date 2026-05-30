// Content extracted from the Binukbok View Point Resort site.

export type Room = {
  slug: string;
  name: string;
  tagline: string; // small colored label above name
  badge: string; // pill on the image card
  price: number;
  guests: string;
  description: string;
  features: string[];
};

export const rooms: Room[] = [
  {
    slug: "couple-room",
    name: "Couple Room",
    tagline: "Romantic Escape",
    badge: "Perfect for couples",
    price: 1500,
    guests: "Up to 2 guests",
    description:
      "Experience unparalleled sunset views in our cozy couple room. Perfect for honeymoons, anniversaries, or a romantic weekend getaway.",
    features: ["Double Bed", "Private Bathroom", "Electric Fan", "Sea View"],
  },
  {
    slug: "family-room",
    name: "Family Room",
    tagline: "Space for Everyone",
    badge: "Best for families",
    price: 2500,
    guests: "Up to 4-6 guests",
    description:
      "Spacious accommodation with bunk beds, ideal for families or groups. Create lasting memories together with your loved ones.",
    features: ["Bunk Beds", "Private Bathroom", "Electric Fan", "Spacious"],
  },
  {
    slug: "kubo-room",
    name: "Kubo Room",
    tagline: "Traditional Filipino",
    badge: "Cultural experience",
    price: 1800,
    guests: "Up to 2-4 guests",
    description:
      "Experience authentic Filipino living in our traditional bamboo kubo. A unique cultural stay with modern comforts.",
    features: ["Traditional Design", "Queen Bed", "Electric Fan", "Native Ambiance"],
  },
  {
    slug: "camping-tent",
    name: "Camping Tent",
    tagline: "Adventure Awaits",
    badge: "Budget friendly",
    price: 800,
    guests: "Up to 2-3 guests",
    description:
      "Sleep under the stars by the beach. Our camping setup provides the perfect adventure experience with comfort.",
    features: ["Quality Tent", "Foam Mattress"],
  },
];

export type DivePackage = {
  slug: string; // matches the DB seed slug — used by /book?dive=<slug> deep links
  name: string;
  tagline: string;
  price: number;
  unit: string;
  description: string;
  features: string[];
  popular?: boolean;
};

export const divePackages: DivePackage[] = [
  {
    slug: "discovery-dive",
    name: "Discovery Dive",
    tagline: "Try Scuba Experience",
    price: 3500,
    unit: "Half Day",
    description:
      "Perfect for beginners! Experience your first underwater adventure with expert guidance.",
    features: [
      "No prior experience needed",
      "Full equipment provided",
      "Shallow water training",
      "Supervised ocean dive",
      "Certificate of completion",
    ],
    popular: true,
  },
  {
    slug: "open-water-certification",
    name: "Open Water Certification",
    tagline: "PADI Open Water Diver",
    price: 18000,
    unit: "3-4 Days",
    description:
      "Get your internationally recognized diving certification and dive anywhere in the world.",
    features: [
      "Complete PADI certification",
      "Theory & practical training",
      "4 open water dives",
      "Lifetime certification",
      "All equipment included",
    ],
  },
  {
    slug: "freediving-course",
    name: "Freediving Course",
    tagline: "Breath-Hold Diving",
    price: 8000,
    unit: "2 Days",
    description:
      "Learn the art of freediving and explore the underwater world on a single breath.",
    features: [
      "Breathing techniques",
      "Safety protocols",
      "Pool & ocean sessions",
      "Equalization training",
      "Basic certification",
    ],
  },
  {
    slug: "fun-dive",
    name: "Fun Dive",
    tagline: "For Certified Divers",
    price: 2500,
    unit: "Per Dive",
    description:
      "Already certified? Join our guided fun dives and explore the beautiful dive sites of Batangas.",
    features: [
      "Guided dive experience",
      "Equipment rental available",
      "Multiple dive sites",
      "Marine life encounters",
      "Underwater photography",
    ],
  },
];

export type Testimonial = {
  initial: string;
  name: string;
  quote: string;
};

export const testimonials: Testimonial[] = [
  {
    initial: "J",
    name: "Jaza Sarmiento",
    quote:
      "Hindi pa ako naging ganito ka-excited pumunta sa mga beach resort hanggang sa ma-discover ko ang Binukbok View Point Resort. Every time na bumibisita ako dito, talagang napapa-wow ako. Parang pamilya ka nila kung asikasuhin!",
  },
  {
    initial: "M",
    name: "Maria Santos",
    quote:
      "The diving experience at BIDA was incredible! The instructors are so patient and professional. Got my PADI certification here and it was the best decision ever.",
  },
  {
    initial: "J",
    name: "John Rivera",
    quote:
      "Perfect getaway from Manila. The sunset view is breathtaking, staff is super friendly, and the Kubo room was such a unique experience. Will definitely come back!",
  },
];

export const stats = [
  { value: "500+", label: "Happy Guests" },
  { value: "100+", label: "Certified Divers" },
  { value: "4.9", label: "Average Rating" },
];

export const contact = {
  location: "Binukbok, Bauan, Batangas, Philippines",
  phone: "0917 868 5265",
  social: "@binukbokviewpoint",
};
