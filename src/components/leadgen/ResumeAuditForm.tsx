import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, X } from 'lucide-react';
import Button from '../Button';
import { supabase } from '../../lib/supabase';
import { submitLead, LeadSubmissionError } from '../../lib/googleSheets';
import { trackEvent, EVENTS } from '../../lib/analytics';
import { phoneError } from '../../../supabase/functions/_shared/auditValidation';
import { getAttribution } from '../../lib/attribution';

const initialState = {
  fullName: '', email: '', countryCode: '+91', phoneNumber: '', currentRole: '',
  yearsOfExperience: '', targetRole: '', currentCTC: '', expectedCTC: '',
  noticePeriodStatus: 'Not on notice period', linkedinUrl: '', jobDescription: '',
};
const countryCodes = ['+91', '+1', '+44', '+971', '+65'];
const noticePeriods = ['Not on notice period', 'On notice period (0-30 days)', 'On notice period (30-60 days)', 'On notice period (60-90 days)', 'Already laid off'];

export default function ResumeAuditForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [resume, setResume] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const tracked = useRef(false);
  const submittingRef = useRef(false);
  const requestId = useRef(crypto.randomUUID());
  const uploadedPath = useRef<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const start = () => {
    if (!tracked.current) { tracked.current = true; trackEvent(EVENTS.LEAD_FORM_STARTED, { form: 'resume_audit' }); trackEvent(EVENTS.AUDIT_STARTED); }
  };
  const change = (name: keyof typeof initialState, value: string) => {
    start(); setForm(previous => ({ ...previous, [name]: value }));
    setErrors(previous => ({ ...previous, [name]: '', ...(name === 'countryCode' ? { phoneNumber: '' } : {}) }));
  };
  const chooseFile = (file?: File) => {
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) || (file.type && file.type !== 'application/pdf')) { setErrors(previous => ({ ...previous, resume: 'Upload a PDF file.' })); return; }
    if (file.size > 10 * 1024 * 1024 || file.size === 0) { setErrors(previous => ({ ...previous, resume: 'Upload a PDF between 1 byte and 10 MB.' })); return; }
    start(); setResume(file); uploadedPath.current = null;
    setErrors(previous => ({ ...previous, resume: '' }));
    trackEvent(EVENTS.RESUME_UPLOADED, { form: 'resume_audit' });
  };
  const field = (name: keyof typeof initialState, label: string, type = 'text', required = false) => <div>
    <label htmlFor={`audit-${name}`} className="block text-sm font-medium text-gray-700 mb-1">{label}{required ? ' *' : ' (optional)'}</label>
    <input id={`audit-${name}`} name={name} type={type} required={required} value={form[name]} onChange={event => change(name, event.target.value)} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `audit-${name}-error` : undefined} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500" />
    {errors[name] && <p id={`audit-${name}-error`} role="alert" className="text-red-600 text-sm mt-1">{errors[name]}</p>}
  </div>;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submittingRef.current) return;
    const validation: Record<string, string> = {};
    if (!form.fullName.trim()) validation.fullName = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) validation.email = 'Enter a valid email address.';
    const phone = form.phoneNumber.trim() ? `${form.countryCode}${form.phoneNumber.replace(/[\s()-]/g, '')}` : '';
    const invalidPhone = phoneError(phone);
    if (invalidPhone) validation.phoneNumber = invalidPhone;
    if (!resume) validation.resume = 'Upload your resume as a PDF.';
    if (form.yearsOfExperience && (!/^\d+(\.\d+)?$/.test(form.yearsOfExperience) || Number(form.yearsOfExperience) > 60)) validation.yearsOfExperience = 'Enter your experience as a number from 0 to 60.';
    if (form.linkedinUrl && !/^https:\/\/(www\.)?linkedin\.com\/in\/[^\s]+$/i.test(form.linkedinUrl)) validation.linkedinUrl = 'Enter a LinkedIn URL starting with https://linkedin.com/in/.';
    setErrors(validation);
    if (Object.keys(validation).length) { document.getElementById(`audit-${Object.keys(validation)[0]}`)?.focus(); return; }
    submittingRef.current = true; setSubmitting(true);
    try {
      if (!uploadedPath.current && resume) {
        const storagePath = `${requestId.current}/${resume.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
        const { error } = await supabase.storage.from('resume-audits').upload(storagePath, resume, { upsert: false });
        if (error) throw new LeadSubmissionError('Your resume could not be uploaded. Please try again.', { resume: 'Resume upload failed. Please try again.' });
        uploadedPath.current = storagePath;
      }
      const receipt = await submitLead({ ...form, email: form.email.trim(), phoneNumber: phone, resumeStoragePath: uploadedPath.current, requestId: requestId.current, attribution: getAttribution() }, 'resume_audit');
      trackEvent(EVENTS.AUDIT_REQUESTED);
      trackEvent(EVENTS.AUDIT_COMPLETED);
      trackEvent(EVENTS.LEAD_FORM_SUBMITTED, { form: 'resume_audit' });
      navigate('/thank-you?type=resume-audit&email=' + (receipt?.emailStatus || 'unconfigured'));
    } catch (error) {
      setErrors(error instanceof LeadSubmissionError ? { submit: error.message, ...error.fields } : { submit: 'We could not save your audit request. Please try again.' });
    } finally { submittingRef.current = false; setSubmitting(false); }
  };
  return <form onSubmit={submit} noValidate className="space-y-6">
    <p className="text-sm text-gray-600">Only your name, email, and resume are required. Add role details if you want a more targeted audit.</p>
    {errors.submit && <p role="alert" className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{errors.submit}</p>}
    <div className="grid sm:grid-cols-2 gap-6">{field('fullName', 'Full name', 'text', true)}{field('email', 'Email', 'email', true)}</div>
    <div>
      <label htmlFor="audit-resume" className="block text-sm font-medium text-gray-700 mb-2">Resume (PDF) *</label>
      <input ref={fileInput} id="audit-resume" type="file" accept="application/pdf,.pdf" onChange={event => chooseFile(event.target.files?.[0])} aria-invalid={Boolean(errors.resume)} aria-describedby="audit-resume-help" className="block w-full text-sm" />
      <p id="audit-resume-help" className="text-sm text-gray-500 mt-2">PDF, up to 10 MB.</p>
      {resume && <div className="flex items-center gap-2 text-sm mt-2"><FileText className="w-4 h-4 text-blue-600" /><span className="break-all">{resume.name}</span><button type="button" aria-label="Remove resume" onClick={() => { setResume(null); uploadedPath.current = null; if (fileInput.current) fileInput.current.value = ''; }}><X className="w-4 h-4" /></button></div>}
      {errors.resume && <p role="alert" className="text-red-600 text-sm mt-1">{errors.resume}</p>}
    </div>
    <details className="border rounded-lg p-4" open={Boolean(errors.phoneNumber || errors.linkedinUrl || errors.yearsOfExperience)}>
      <summary className="font-medium cursor-pointer">Optional contact and role details</summary>
      <div className="grid sm:grid-cols-2 gap-6 mt-5">
        <div className="sm:col-span-2"><label htmlFor="audit-phoneNumber" className="block text-sm font-medium mb-1">Phone number (optional)</label><div className="flex gap-2"><select aria-label="Phone country code" value={form.countryCode} onChange={event => change('countryCode', event.target.value)} className="border rounded-lg p-2">{countryCodes.map(code => <option key={code}>{code}</option>)}</select><input id="audit-phoneNumber" type="tel" value={form.phoneNumber} onChange={event => change('phoneNumber', event.target.value)} aria-invalid={Boolean(errors.phoneNumber)} aria-describedby="audit-phone-error" className="flex-1 min-w-0 border rounded-lg p-2" placeholder="9876543210" /></div>{errors.phoneNumber && <p id="audit-phone-error" role="alert" className="text-red-600 text-sm mt-1">{errors.phoneNumber}</p>}</div>
        {field('currentRole', 'Current role')}{field('targetRole', 'Target role')}{field('yearsOfExperience', 'Years of experience')}{field('linkedinUrl', 'LinkedIn profile URL', 'url')}{field('currentCTC', 'Current CTC')}{field('expectedCTC', 'Expected CTC')}
        <div className="sm:col-span-2"><label htmlFor="audit-notice" className="block text-sm font-medium mb-1">Notice period (optional)</label><select id="audit-notice" value={form.noticePeriodStatus} onChange={event => change('noticePeriodStatus', event.target.value)} className="w-full border rounded-lg p-2">{noticePeriods.map(period => <option key={period}>{period}</option>)}</select></div>
        <div className="sm:col-span-2"><label htmlFor="audit-description" className="block text-sm font-medium mb-1">Target job description (optional)</label><textarea id="audit-description" rows={3} value={form.jobDescription} onChange={event => change('jobDescription', event.target.value)} className="w-full border rounded-lg p-2" /></div>
      </div>
    </details>
    <Button type="submit" className="w-full" disabled={submitting}><Upload className="w-4 h-4 mr-2" />{submitting ? 'Submitting…' : 'Get Free Resume Audit'}</Button>
  </form>;
}
