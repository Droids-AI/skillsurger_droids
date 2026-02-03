import { useState } from 'react';
import { Briefcase, MapPin, Clock, DollarSign, Send } from 'lucide-react';
import Button from '../components/Button';
import SEO from '../components/SEO';

const departments = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Customer Success',
  'Operations'
];

const openings = [
  {
    id: 1,
    title: 'Senior Full Stack Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    salary: '$130,000 - $180,000',
    description: `We're looking for a Senior Full Stack Engineer to help build the future of career development technology...`,
    requirements: [
      'Minimum 5 years of experience with modern web technologies',
      'Strong expertise in React, Node.js, and TypeScript',
      'Experience with AI/ML integration is a plus',
      'Proven track record of building scalable applications'
    ]
  },
  {
    id: 2,
    title: 'Product Manager',
    department: 'Product',
    location: 'San Francisco, CA',
    type: 'Full-time',
    salary: '$120,000 - $160,000',
    description: 'Join our product team to shape the future of AI-powered career guidance...',
    requirements: [
      '3+ years of product management experience',
      'Experience with AI/ML products',
      'Strong analytical and problem-solving skills',
      'Excellent communication and leadership abilities'
    ]
  },
  {
    id: 3,
    title: 'UI/UX Designer',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
    salary: '$90,000 - $130,000',
    description: 'Help create beautiful and intuitive experiences for our users...',
    requirements: [
      '3+ years of experience in product design',
      'Strong portfolio showing web application design',
      'Experience with Figma and modern design tools',
      'Understanding of user-centered design principles'
    ]
  }
];

const benefits = [
  {
    title: 'Health & Wellness',
    items: [
      'Comprehensive health insurance',
      'Dental and vision coverage',
      'Mental health support',
      'Gym membership stipend'
    ]
  },
  {
    title: 'Work-Life Balance',
    items: [
      'Unlimited PTO',
      'Flexible working hours',
      'Remote work options',
      'Paid parental leave'
    ]
  },
  {
    title: 'Growth & Development',
    items: [
      'Learning & development budget',
      'Conference attendance',
      'Career mentorship',
      'Internal mobility'
    ]
  },
  {
    title: 'Perks',
    items: [
      'Competitive salary',
      'Stock options',
      '401(k) matching',
      'Home office stipend'
    ]
  }
];

export default function Careers() {
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [applicationData, setApplicationData] = useState({
    name: '',
    email: '',
    resume: null as File | null,
    coverLetter: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const filteredJobs = selectedDepartment === 'All'
    ? openings
    : openings.filter(job => job.department === selectedDepartment);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
      setApplicationData({
        name: '',
        email: '',
        resume: null,
        coverLetter: ''
      });
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <SEO 
        title="Careers at Skillsurger | Join Our Team"
        description="Join the Skillsurger team! Explore exciting career opportunities in engineering, product, design, marketing, and more. Help us transform careers with AI."
        keywords="Skillsurger careers, job openings, work at Skillsurger, career opportunities"
        canonicalUrl="/careers"
      />
      {/* Hero Section */}
      <section className="relative py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-6">
              Join Us in Transforming Careers
            </h1>
            <p className="text-xl text-blue-100">
              We're building the future of career development with AI. Join our team and make a difference in people's lives.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Why Join Skillsurger?</h2>
            <p className="text-gray-600 mb-12">
              We're a team of passionate individuals working together to democratize career development through technology.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-4">{benefit.title}</h3>
                <ul className="space-y-2">
                  {benefit.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-center text-gray-600">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Open Positions</h2>

          {/* Department Filter */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <button
              onClick={() => setSelectedDepartment('All')}
              className={`px-4 py-2 rounded-full ${
                selectedDepartment === 'All'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
                className={`px-4 py-2 rounded-full ${
                  selectedDepartment === dept
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Job Listings */}
          <div className="grid gap-6">
            {filteredJobs.map(job => (
              <div key={job.id} className="bg-white border rounded-lg p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 text-gray-600">
                      <span className="flex items-center">
                        <Briefcase className="w-4 h-4 mr-1" />
                        {job.department}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {job.location}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {job.type}
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {job.salary}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    {selectedJob === job.id ? (
                      <span className="hidden sm:inline">Hide Details</span>
                    ) : (
                      <span className="hidden sm:inline">View Details</span>
                    )}
                    <span className="sm:hidden">
                      {selectedJob === job.id ? 'Hide' : 'View'}
                    </span>
                  </Button>
                </div>

                {selectedJob === job.id && (
                  <div className="mt-6">
                    <div className="prose max-w-none">
                      <p className="text-gray-600 mb-4">{job.description}</p>
                      <h4 className="text-lg font-semibold mb-2">Requirements:</h4>
                      <ul className="list-disc list-inside text-gray-600">
                        {job.requirements.map((req, index) => (
                          <li key={index}>{req}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Application Form */}
                    {success ? (
                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                        Thank you for your application! We'll be in touch soon.
                      </div>
                    ) : (
                      <form onSubmit={handleApply} className="mt-6 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={applicationData.name}
                            onChange={(e) => setApplicationData({ ...applicationData, name: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={applicationData.email}
                            onChange={(e) => setApplicationData({ ...applicationData, email: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Resume
                          </label>
                          <input
                            type="file"
                            onChange={(e) => setApplicationData({ ...applicationData, resume: e.target.files?.[0] || null })}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            accept=".pdf,.doc,.docx"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cover Letter
                          </label>
                          <textarea
                            value={applicationData.coverLetter}
                            onChange={(e) => setApplicationData({ ...applicationData, coverLetter: e.target.value })}
                            rows={4}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          ></textarea>
                        </div>

                        <Button type="submit" disabled={submitting} size="md" className="w-full sm:w-auto">
                          {submitting ? (
                            <span className="flex items-center justify-center">
                              <span className="hidden sm:inline">Submitting...</span>
                              <span className="sm:hidden">Submitting</span>
                            </span>
                          ) : (
                            <span className="flex items-center justify-center">
                              <span className="hidden sm:inline">Submit Application</span>
                              <span className="sm:hidden">Apply</span>
                              <Send className="w-4 h-4 ml-1 sm:ml-2" />
                            </span>
                          )}
                        </Button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}