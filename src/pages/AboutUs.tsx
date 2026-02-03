import { Brain, Target, Users, Globe, Award } from 'lucide-react';
import SEO from '../components/SEO';

const values = [
  {
    icon: Brain,
    title: 'Innovation First',
    description: 'We leverage cutting-edge AI technology to revolutionize career development.'
  },
  {
    icon: Target,
    title: 'User-Centric',
    description: "Every feature and decision is made with our users' success in mind."
  },
  {
    icon: Users,
    title: 'Inclusive Growth',
    description: 'We believe in making career development accessible to everyone.'
  },
  {
    icon: Globe,
    title: 'Global Impact',
    description: 'Our mission is to transform careers worldwide through AI-powered guidance.'
  }
];

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <SEO 
        title="About Skillsurger | AI-Powered Career Platform"
        description="Learn about Skillsurger's mission to transform careers through AI innovation. Discover how we help thousands of professionals achieve their career goals."
        keywords="about Skillsurger, AI career platform, career development mission, AI career technology"
        canonicalUrl="/about"
      />
      {/* Hero Section */}
      <section className="relative py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-6">
              Transforming Careers Through AI Innovation
            </h1>
            <p className="text-xl text-blue-100">
              At Skillsurger, we're on a mission to democratize career development by combining human expertise with artificial intelligence.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="prose max-w-none text-gray-600">
              <p className="mb-4">
                Founded in 2023, Skillsurger emerged from a simple observation: traditional career guidance wasn't keeping pace with the rapidly evolving job market. Our founders, experienced professionals from tech and career development backgrounds, saw an opportunity to leverage AI to provide personalized, scalable career guidance.
              </p>
              <p className="mb-4">
                What started as a small team with a big vision has grown into a platform that helps thousands of professionals navigate their career journeys. We've combined advanced AI technology with human expertise to create a unique approach to career development that's both powerful and accessible.
              </p>
              <p>
                Today, Skillsurger is at the forefront of career development technology, continuously innovating to provide the most effective tools and guidance for professional growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
                  <value.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-xl text-gray-600 mb-8">
              To empower every professional with AI-driven career guidance that adapts to their unique goals, skills, and aspirations. We believe that with the right tools and insights, anyone can achieve their career potential.
            </p>
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Brain className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI-Powered Insights</h3>
                <p className="text-gray-600">Leveraging advanced AI to provide personalized career recommendations and guidance.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Goal-Oriented</h3>
                <p className="text-gray-600">Every feature is designed to help you achieve your specific career objectives.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Community Driven</h3>
                <p className="text-gray-600">Building a supportive community of professionals helping each other grow.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-gray-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">100+</div>
              <div className="text-gray-400">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-gray-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-gray-400">AI Support</div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}