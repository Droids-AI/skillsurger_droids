export interface Testimonial {
  name: string;
  role: string;
  company: string;
  quote: string;
  rating: number;
}

export const testimonials: Testimonial[] = [
  {
    name: "Mahesh Kumar",
    role: "Software Engineer",
    company: "Infosys",
    quote:
      "Skillsurger's AI agent helped me transition from junior to senior engineer in just 6 months. The personalized guidance was incredible!",
    rating: 5,
  },
  {
    name: "Ruchi Sharma",
    role: "Data Scientist",
    company: "Tredence",
    quote:
      "The AI-powered learning paths were exactly what I needed. I landed my dream job at Tredence thanks to the structured guidance.",
    rating: 5,
  },
  {
    name: "Rohan Patel",
    role: "Product Manager",
    company: "GE",
    quote:
      "The mock interviews and CV optimization features gave me the confidence to apply for senior roles. Now I'm at GE!",
    rating: 5,
  },
];
