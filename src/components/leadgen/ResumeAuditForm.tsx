import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, X } from 'lucide-react';
import Button from '../Button';
import { supabase } from '../../lib/supabase';
import { submitLead } from '../../lib/googleSheets';
import { trackEvent, EVENTS } from '../../lib/analytics';

const countryCodes = [
  { value: '+91', label: 'India (+91)' },
  { value: '+1', label: 'United States (+1)' },
  { value: '+44', label: 'United Kingdom (+44)' },
  { value: '+971', label: 'UAE (+971)' },
  { value: '+65', label: 'Singapore (+65)' },
];

const noticePeriodOptions = [
  'Not on notice period',
  'On notice period (0-30 days)',
  'On notice period (30-60 days)',
  'On notice period (60-90 days)',
  'Already laid off',
];

const MAX_FILE_SIZE_MB = 10;

interface FormState {
  fullName: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  currentRole: string;
  yearsOfExperience: string;
  targetRole: string;
  currentCTC: string;
  expectedCTC: string;
  noticePeriodStatus: string;
  linkedinUrl: string;
  jobDescription: string;
}

const initialState: FormState = {
  fullName: '',
  email: '',
  countryCode: '+91',
  phoneNumber: '',
  currentRole: '',
  yearsOfExperience: '',
  targetRole: '',
  currentCTC: '',
  expectedCTC: '',
  noticePeriodStatus: noticePeriodOptions[0],
  linkedinUrl: '',
  jobDescription: '',
};

function getAnonId(): string {
  const key = 'ss_anon_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

export default function ResumeAuditForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormState>(initialState);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasTrackedStart = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = 'Free Resume Audit | Skillsurger';
  }, []);

  const trackStartOnce = () => {
    if (!hasTrackedStart.current) {
      hasTrackedStart.current = true;
      trackEvent(EVENTS.LEAD_FORM_STARTED, { form: 'resume_audit' });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    trackStartOnce();
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setErrors((prev) => ({ ...prev, resume: 'Please upload a PDF file.' }));
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, resume: `File must be under ${MAX_FILE_SIZE_MB}MB.` }));
      return;
    }

    trackStartOnce();
    setErrors((prev) => ({ ...prev, resume: '' }));
    setResumeFile(file);
    trackEvent(EVENTS.RESUME_UPLOADED, { form: 'resume_audit' });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    if (!formData.currentRole.trim()) newErrors.currentRole = 'Current role is required';
    if (!formData.yearsOfExperience.trim()) newErrors.yearsOfExperience = 'Years of experience is required';
    if (!formData.targetRole.trim()) newErrors.targetRole = 'Target role is required';
    if (!resumeFile) newErrors.resume = 'Please upload your resume (PDF)';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      let resumeStoragePath: string | null = null;

      if (resumeFile) {
        const anonId = getAnonId();
        const safeName = resumeFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const path = `${anonId}/${Date.now()}_${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from('resume-audits')
          .upload(path, resumeFile);

        if (uploadError) {
          throw new Error(`Resume upload failed: ${uploadError.message}`);
        }
        resumeStoragePath = path;
      }

      await submitLead(
        {
          fullName: formData.fullName.trim(),
          email: formData.email.trim(),
          phoneNumber: `${formData.countryCode}${formData.phoneNumber}`,
          currentRole: formData.currentRole.trim(),
          yearsOfExperience: formData.yearsOfExperience.trim(),
          targetRole: formData.targetRole.trim(),
          currentCTC: formData.currentCTC.trim(),
          expectedCTC: formData.expectedCTC.trim(),
          noticePeriodStatus: formData.noticePeriodStatus,
          linkedinUrl: formData.linkedinUrl.trim(),
          jobDescription: formData.jobDescription.trim(),
          resumeStoragePath,
        },
        'resume_audit'
      );

      trackEvent(EVENTS.AUDIT_REQUESTED);
      trackEvent(EVENTS.LEAD_FORM_SUBMITTED, { form: 'resume_audit' });

      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/thank-you?type=resume-audit');
      }, 1200);
    } catch (error) {
      console.error('Resume audit submission failed:', error);
      setErrors({ submit: 'Something went wrong submitting your audit request. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-green-800">
        <p className="font-semibold mb-1">Your resume has been received.</p>
        <p className="text-sm">
          We'll analyze it for ATS gaps, positioning issues, role-fit, and improvement opportunities.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          {errors.submit}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number*</label>
          <div className="flex gap-2">
            <select
              name="countryCode"
              value={formData.countryCode}
              onChange={handleChange}
              className="rounded-lg border border-gray-300 px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {countryCodes.map((c) => (
                <option key={c.value} value={c.value}>{c.value}</option>
              ))}
            </select>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {errors.phoneNumber && <p className="text-red-600 text-xs mt-1">{errors.phoneNumber}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notice Period Status</label>
          <select
            name="noticePeriodStatus"
            value={formData.noticePeriodStatus}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {noticePeriodOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile URL</label>
          <input
            type="url"
            name="linkedinUrl"
            placeholder="https://linkedin.com/in/..."
            value={formData.linkedinUrl}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Role*</label>
          <input
            type="text"
            name="currentRole"
            value={formData.currentRole}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.currentRole && <p className="text-red-600 text-xs mt-1">{errors.currentRole}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience*</label>
          <input
            type="text"
            name="yearsOfExperience"
            value={formData.yearsOfExperience}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.yearsOfExperience && <p className="text-red-600 text-xs mt-1">{errors.yearsOfExperience}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Role*</label>
          <input
            type="text"
            name="targetRole"
            value={formData.targetRole}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.targetRole && <p className="text-red-600 text-xs mt-1">{errors.targetRole}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current CTC</label>
          <input
            type="text"
            name="currentCTC"
            placeholder="e.g. ₹18 LPA"
            value={formData.currentCTC}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected CTC</label>
          <input
            type="text"
            name="expectedCTC"
            placeholder="e.g. ₹30 LPA"
            value={formData.expectedCTC}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Job Description (optional — the role you are targeting)
        </label>
        <textarea
          name="jobDescription"
          rows={3}
          value={formData.jobDescription}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Resume Upload (PDF)*</label>
        {resumeFile ? (
          <div className="flex items-center justify-between rounded-lg border border-gray-300 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FileText className="w-4 h-4 text-blue-600" />
              {resumeFile.name}
            </div>
            <button
              type="button"
              onClick={() => {
                setResumeFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-gray-500 cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-colors">
            <Upload className="w-5 h-5" />
            <span className="text-sm">Click to upload your resume (PDF, max {MAX_FILE_SIZE_MB}MB)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
        {errors.resume && <p className="text-red-600 text-xs mt-1">{errors.resume}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Get Free Resume Audit'}
      </Button>
    </form>
  );
}
