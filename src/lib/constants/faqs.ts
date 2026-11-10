export interface FAQ {
  question: string;
  answer: string;
}

export const faqs: FAQ[] = [
  {
    question: "How accurate is the AI feedback?",
    answer:
      "Our tools help you review resume structure and keywords, explore job opportunities, and practice interview answers. Review the feedback against your experience and the requirements of your target role.",
  },
  {
    question: "Is my resume data safe and private?",
    answer:
      "Your data is encrypted in transit and at rest, and we never sell it or share your resume for advertising. To run the AI features, the text you submit (resume, mentor chats, interview answers and, if you turn on your camera, interview frames) is sent to our AI provider, OpenAI, for processing. You can delete your data anytime from Profile in your dashboard, or email support@skillsurger.com to close your account. See our Privacy Policy for the full list of service providers.",
  },
  {
    question: "How much time do I need to invest?",
    answer:
      "Most users see results in 15-30 minutes per day. CV scan takes 2 minutes, job matching is instant, and mock interviews are 10-15 minutes each. You can go at your own pace.",
  },
  {
    question: "What's included in the free trial?",
    answer:
      "Everything! Full access to CV scanning, job matching, mock interviews, and learning paths for 7 days. No credit card required. Experience the complete platform risk-free.",
  },
  {
    question: "How is this different from job boards like Naukri?",
    answer:
      "We don't just list jobs—we prepare you to win them. Get personalized CV fixes, practice interviews with AI feedback, and match to jobs that fit your exact skills. It's like having a personal career coach available 24/7.",
  },
  {
    question: "How soon will I see results?",
    answer:
      "Most users improve their CV score within the first session. For job applications, users typically see more interview calls within 2-3 weeks of implementing our recommendations.",
  },
];
