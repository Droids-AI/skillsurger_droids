import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../Button';
import { submitLead } from '../../lib/googleSheets';
import { trackEvent, EVENTS } from '../../lib/analytics';

const countryCodes = [
  { value: '+91', label: '+91' },
  { value: '+1', label: '+1' },
  { value: '+44', label: '+44' },
  { value: '+971', label: '+971' },
  { value: '+65', label: '+65' },
];

const jobStatusOptions = [
  'Employed, exploring options',
  'On notice period',
  'Laid off / between jobs',
];

const preferredSlotOptions = [
  'Weekday mornings',
  'Weekday afternoons',
  'Weekday evenings',
  'Weekends',
];

interface FormState {
  name: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  currentRole: string;
  targetRole: string;
  yearsOfExperience: string;
  currentJobStatus: string;
  biggestChallenge: string;
  preferredSlot: string;
}

const initialState: FormState = {
  name: '',
  email: '',
  countryCode: '+91',
  phoneNumber: '',
  currentRole: '',
  targetRole: '',
  yearsOfExperience: '',
  currentJobStatus: jobStatusOptions[0],
  biggestChallenge: '',
  preferredSlot: preferredSlotOptions[0],
};

export default function DiagnosisBookingForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const hasTrackedStart = useRef(false);

  const trackStartOnce = () => {
    if (!hasTrackedStart.current) {
      hasTrackedStart.current = true;
      trackEvent(EVENTS.LEAD_FORM_STARTED, { form: 'diagnosis_booking' });
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
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
    if (!formData.targetRole.trim()) newErrors.targetRole = 'Target role is required';
    if (!formData.yearsOfExperience.trim()) newErrors.yearsOfExperience = 'Experience is required';
    if (!formData.biggestChallenge.trim()) newErrors.biggestChallenge = 'This helps us prepare for the call';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await submitLead(
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phoneNumber: `${formData.countryCode}${formData.phoneNumber}`,
          currentRole: formData.currentRole.trim(),
          targetRole: formData.targetRole.trim(),
          yearsOfExperience: formData.yearsOfExperience.trim(),
          currentJobStatus: formData.currentJobStatus,
          biggestChallenge: formData.biggestChallenge.trim(),
          preferredSlot: formData.preferredSlot,
        },
        'diagnosis_booking'
      );

      trackEvent(EVENTS.DIAGNOSIS_BOOKED);
      trackEvent(EVENTS.LEAD_FORM_SUBMITTED, { form: 'diagnosis_booking' });

      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/thank-you?type=diagnosis-booking');
      }, 1200);
    } catch (error) {
      console.error('Diagnosis booking submission failed:', error);
      setErrors({ submit: 'Something went wrong booking your call. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-green-800">
        <p className="font-semibold mb-1">Your career diagnosis call request is received.</p>
        <p className="text-sm">We'll follow up to confirm your preferred slot.</p>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
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
                <option key={c.value} value={c.value}>{c.label}</option>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Job Status</label>
          <select
            name="currentJobStatus"
            value={formData.currentJobStatus}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {jobStatusOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time Slot</label>
          <select
            name="preferredSlot"
            value={formData.preferredSlot}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {preferredSlotOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Biggest Job-Search Challenge Right Now*
        </label>
        <textarea
          name="biggestChallenge"
          rows={3}
          value={formData.biggestChallenge}
          onChange={handleChange}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.biggestChallenge && <p className="text-red-600 text-xs mt-1">{errors.biggestChallenge}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Book Career Diagnosis'}
      </Button>
    </form>
  );
}
