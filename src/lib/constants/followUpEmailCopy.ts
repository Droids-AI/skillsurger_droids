/** Optional follow-up copy for operators. Immediate webinar and resume-audit
 * receipts are implemented by the server handlers and leadConfirmation helper.
 * Diagnosis follow-up scheduling remains an operator workflow. */
export interface FollowUpEmailCopy {
  subject: string;
  body: string;
}

export const resumeAuditFollowUpEmail: FollowUpEmailCopy = {
  subject: 'Your Skillsurger Resume Audit Request Is Received',
  body: `Hi {{first_name}},

Thanks for submitting your resume to Skillsurger.

We'll review it for ATS gaps, role-fit, keyword strength, structure, impact, and job-search readiness.

While your audit is being prepared, you can also explore Skillsurger Job Switch Copilot — a structured system to help Indian tech professionals improve their resume, applications, outreach, and interview preparation.

Next step: Book a career diagnosis call or explore the Job Switch Copilot plans.

Regards,
Team Skillsurger`,
};

export const diagnosisBookingFollowUpEmail: FollowUpEmailCopy = {
  subject: 'Your Skillsurger Career Diagnosis Call Request Is Received',
  body: `Hi {{first_name}},

Thanks for booking a career diagnosis call with Skillsurger.

We'll follow up shortly to confirm your preferred time slot.

While you wait, you can get a free resume audit or explore Skillsurger Job Switch Copilot to see the full structured job-search system.

Regards,
Team Skillsurger`,
};
