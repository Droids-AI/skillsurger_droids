import React from 'react';
import { Calendar, Clock, ArrowRight, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generatedBlogs } from '../content/blogs.generated';
import SEO from '../components/SEO';

const Blog = () => {
  const generatedCards = generatedBlogs.map((p, index) => ({
    id: 1000 + index,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    readTime: p.readTime,
    date: p.date,
    image: p.image,
    slug: p.slug,
  }));

  const staticPosts = [
    {
      id: 0,
      title: "Why Most Job Applications Fail in India (And the Exact Fixes No One Teaches)",
      excerpt: "Every day, thousands of qualified candidates apply for jobs and hear nothing back. Not because they are bad—but because the process is broken. Recruiters don't read applications the way candidates think they do.",
      category: "Career Advice",
      readTime: "8 min read",
      date: "January 20, 2025",
      image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      slug: "why-job-applications-fail-india"
    },
    {
      id: 1,
      title: "Best AI Résumé Builder Tools to Beat ATS Filters in Minutes",
      excerpt: "Getting past Applicant Tracking Systems (ATS) has become the single biggest hurdle between talented job-seekers and human recruiters. An estimated 75% of applications are rejected by bots before a person ever reads them.",
      category: "Resume Building",
      readTime: "12 min read",
      date: "January 15, 2025",
      image: "/best_ai_resume_builder_tools_to_beat.png",
      slug: "ai-resume-builder-tools"
    },
    {
      id: 2,
      title: "Top AI Interview Questions & Answers to Ace Your Next Engineer Role",
      excerpt: "Recruiters now screen AI engineers with deeper technical drills and behavioral puzzles—often under tight time-limits on Zoom. The right AI interview questions can mean the difference between awkward silence and a confident, structured answer.",
      category: "Interview Prep",
      readTime: "15 min read",
      date: "January 12, 2025",
      image: "/top_ai_interview_questions_answers_to_ace.png",
      slug: "ai-interview-questions"
    },
    {
      id: 3,
      title: "About-Me Section Mastery: Write a 30-Second Hook That Grabs Recruiters",
      excerpt: "When recruiters skim hundreds of CVs, they decide in as little as 6 seconds whether to keep reading. The first line that catches their eye? Your About Me in résumé summary. Craft it well and you own the narrative.",
      category: "Resume Building",
      readTime: "8 min read",
      date: "January 10, 2025",
      image: "/about_me_section_mastery.png",
      slug: "about-me-in-resume"
    },
    {
      id: 4,
      title: "Is a Resume Coach Worth It? Pricing, ROI & Top AI Tools Compared",
      excerpt: "Job seekers are facing more rejections and longer hiring cycles than ever before. The right resume coach—especially if AI-powered—can mean the difference between weeks of silence and a fast-track offer.",
      category: "Career Advice",
      readTime: "10 min read",
      date: "January 8, 2025",
      image: "/is_a_resume_coach_worth_it.png",
      slug: "resume-coach-ai-tools"
    },
    {
      id: 5,
      title: "Immediate-Hire Jobs: 20 Industries Where You Can Start This Week",
      excerpt: "If you need a paycheck fast, you're not alone. Search volume for 'immediate hire jobs' is booming as job seekers chase roles that pay quickly, skip long interviews, and get you on the schedule within days.",
      category: "Job Search",
      readTime: "11 min read",
      date: "January 5, 2025",
      image: "/immediate-hire-jobs.png",
      slug: "immediate-hire-jobs"
    },
    {
      id: 6,
      title: "How to Find High-Paying Local Jobs in Under 10 Minutes",
      excerpt: "Are you tired of endless job-board scrolling, only to see duplicates and dead ends? The search for local jobs—those within your commute sweet spot and pay target—often turns into hours wasted chasing outdated listings.",
      category: "Job Search",
      readTime: "9 min read",
      date: "January 3, 2025",
      image: "/how_to_find_high_paying_local_jobs.png",
      slug: "local-jobs"
    },
    {
      id: 7,
      title: "Internships Near Me: A 4-Week Action Plan for Students",
      excerpt: "Searching 'internships near me' is a student ritual every semester—but most applicants struggle with tight deadlines, unpaid roles, and the endless guessing game of where to even start.",
      category: "Career Development",
      readTime: "13 min read",
      date: "January 1, 2025",
      image: "/internship_near_me.png",
      slug: "internships-near-me"
    },
    {
      id: 8,
      title: "AI-Powered Career Options Matrix: 25 Paths You Haven't Considered",
      excerpt: "With automation and AI reshaping the job market, the range of viable career options is wider—and more surprising—than ever. If you're stuck in analysis paralysis, tired of the same old lists, or worried about investing in the 'wrong' skill.",
      category: "Career Development",
      readTime: "14 min read",
      date: "December 28, 2024",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      slug: "career-options"
    },
    {
      id: 9,
      title: "Interview Skills Upgrade: STAR-Plus-CAR Framework & Video Hacks",
      excerpt: "Strong interview skills aren't just about what you know—they're about how clearly, concisely, and confidently you say it. With more recruiters screening candidates on Zoom, answering with structure, body language, and impact is more vital than ever.",
      category: "Interview Prep",
      readTime: "12 min read",
      date: "December 25, 2024",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      slug: "interview-skills"
    },
    {
      id: 10,
      title: "Must-Know Technical Interview Questions (With Code Walkthroughs)",
      excerpt: "Every tech job-seeker faces the same hurdle: a wall of technical interview questions drawn from Python, SQL, machine learning, and more. But with the flood of online lists, how do you know which questions matter?",
      category: "Technical Interviews",
      readTime: "18 min read",
      date: "December 22, 2024",
      image: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      slug: "technical-interview-questions"
    },
    {
      id: 11,
      title: "Entry-Level IT Jobs: Certification Roadmap & Salary Ladder",
      excerpt: "Breaking into tech feels like a catch-22: you need experience to get hired, but you need a job to get experience. The best entry-level IT jobs now require just months of prep with the right certs, résumé template, and smart job search tactics.",
      category: "Career Development",
      readTime: "11 min read",
      date: "December 20, 2024",
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
      slug: "entry-level-it-jobs"
    }
  ];

  const blogPosts = [
    ...generatedCards,
    ...staticPosts,
  ];

  const categories = [
    "All",
    "Resume Building",
    "Interview Prep",
    "Career Advice",
    "Job Search",
    "Technical Interviews",
    "Career Development"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO 
        title="Career Development Blog | Skillsurger"
        description="Expert insights on AI-powered career development, resume building, interview prep, and job search strategies. Get the latest career tips from Skillsurger."
        keywords="career blog, job search tips, resume tips, interview preparation, AI career advice"
        canonicalUrl="/blog"
      />
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Skillsurger Blog
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Expert insights on AI-powered career development, job search strategies, and professional growth.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search articles..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="py-8 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                  index === 0
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden"
              >
                <div className="relative aspect-video">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    width="800"
                    height="450"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {post.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4 mr-1" />
                    {post.date}
                    <Clock className="w-4 h-4 ml-4 mr-1" />
                    {post.readTime}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <Link
                    to={`/blog/${post.slug}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                  >
                    Read More
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          
          {/* Load More Button */}
          <div className="text-center mt-12">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
              Load More Articles
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Stay Updated with Career Insights
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Get the latest articles on AI-powered career development, job search strategies, and professional growth delivered to your inbox.
          </p>
          
          <div className="max-w-md mx-auto flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-l-lg border-0 focus:ring-2 focus:ring-white text-gray-900"
            />
            <button className="bg-white text-blue-600 px-6 py-3 rounded-r-lg font-medium hover:bg-gray-100 transition-colors duration-200">
              Subscribe
            </button>
          </div>
          
          <p className="text-blue-100 text-sm mt-4">
            No spam, unsubscribe at any time.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Blog;