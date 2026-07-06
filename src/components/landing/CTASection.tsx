import { useNavigate } from 'react-router-dom';
import Button from '../Button';
import { ArrowRight } from 'lucide-react';

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  footnote?: string;
}

export default function CTASection({
  title = 'Ready to land your dream job?',
  subtitle = "Join thousands of job seekers who've transformed their careers with AI-powered guidance",
  ctaLabel = 'Start Free Trial',
  ctaHref = '/signup',
  footnote = 'No credit card required • 7-day free trial • Cancel anytime',
}: CTASectionProps) {
  const navigate = useNavigate();

  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          {title}
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          {subtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate(ctaHref)}
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            {ctaLabel}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        <p className="mt-6 text-white/80 text-sm">
          {footnote}
        </p>
      </div>
    </section>
  );
}
