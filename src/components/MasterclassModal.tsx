import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { submitToGoogleSheets } from '../lib/googleSheets';

interface MasterclassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const countryCodes = [
  { value: '+91', label: 'India (+91)' },
  { value: '+1', label: 'United States (+1)' },
  { value: '+44', label: 'United Kingdom (+44)' },
  { value: '+61', label: 'Australia (+61)' },
  { value: '+1', label: 'Canada (+1)' },
  { value: '+49', label: 'Germany (+49)' },
  { value: '+33', label: 'France (+33)' },
  { value: '+65', label: 'Singapore (+65)' },
  { value: '+81', label: 'Japan (+81)' },
  { value: '+86', label: 'China (+86)' },
  { value: '+55', label: 'Brazil (+55)' },
  { value: '+27', label: 'South Africa (+27)' },
  { value: '+971', label: 'UAE (+971)' },
  { value: '+7', label: 'Russia (+7)' },
  { value: '+52', label: 'Mexico (+52)' },
  { value: '+39', label: 'Italy (+39)' },
  { value: '+34', label: 'Spain (+34)' },
  { value: '+31', label: 'Netherlands (+31)' },
  { value: '+46', label: 'Sweden (+46)' },
  { value: '+41', label: 'Switzerland (+41)' },
];

export default function MasterclassModal({ isOpen, onClose }: MasterclassModalProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    countryCode: '+91',
    phonenumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [countryCodeWidth, setCountryCodeWidth] = useState(140);
  const selectRef = useRef<HTMLSelectElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  // Calculate country code dropdown width based on selected option
  useEffect(() => {
    if (!selectRef.current) return;

    const selectedOption = countryCodes.find(code => code.value === formData.countryCode);
    if (selectedOption && measureRef.current) {
      // Measure the text width
      measureRef.current.textContent = selectedOption.label;
      const textWidth = measureRef.current.offsetWidth;
      // Add padding (32px right for dropdown arrow + 16px left padding)
      const newWidth = Math.max(110, Math.min(220, textWidth + 48));
      setCountryCodeWidth(newWidth);
    }
  }, [formData.countryCode]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSubmitting, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phonenumber.trim()) {
      newErrors.phonenumber = 'Phone number is required';
    } else if (!/^\d+$/.test(formData.phonenumber)) {
      newErrors.phonenumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await submitToGoogleSheets({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phoneNumber: `${formData.countryCode}${formData.phonenumber}`,
        timestamp: new Date().toISOString(),
      });

      setSubmitSuccess(true);
      // Reset form
      setFormData({
        name: '',
        email: '',
        countryCode: '+91',
        phonenumber: '',
      });

      // Redirect to thank you page after a brief delay
      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
        navigate('/thank-you');
      }, 800);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Failed to submit. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // Close modal when clicking outside (but not when clicking inside)
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
        style={{
          height: 'auto',
          width: '100%',
          maxHeight: '90vh',
          background: 'rgb(2, 7, 38)',
          color: 'rgb(255, 255, 255)',
          borderRadius: '16px',
          boxShadow: 'rgba(2, 7, 38, 0.16) 0px 8px 32px 0px',
          padding: '32px',
          maxWidth: '420px',
          minWidth: '320px',
          margin: '0px auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0px',
          position: 'relative',
          overflowY: 'auto',
        }}
      >
        {/* Hidden element to measure text width */}
        <span
          ref={measureRef}
          style={{
            position: 'absolute',
            visibility: 'hidden',
            whiteSpace: 'nowrap',
            fontFamily: 'Inter, "Inter Placeholder", sans-serif',
            fontWeight: 500,
            fontSize: '16px',
          }}
        />
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          disabled={isSubmitting}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              color: 'rgb(255, 255, 255)',
              fontWeight: 600,
              fontSize: '20px',
              marginBottom: '4px',
              fontFamily: 'Inter, "Inter Placeholder", sans-serif',
            }}
          >
            Watch the Exclusive Masterclass!
          </div>
          <div
            style={{
              color: 'rgb(161, 168, 183)',
              fontWeight: 400,
              fontSize: '15px',
              fontFamily: 'Inter, "Inter Placeholder", sans-serif',
            }}
          >
            Enter your details and start watching immediately.
          </div>
        </div>

        <div
          style={{
            height: '1px',
            background: 'rgb(35, 42, 71)',
            marginBottom: '24px',
            opacity: 0.18,
          }}
        />

        {submitSuccess ? (
          <div className="text-center py-8">
            <div className="text-green-400 text-lg font-semibold mb-2">Success!</div>
            <div className="text-gray-400">Your details have been submitted. Redirecting...</div>
          </div>
        ) : (
          <form
            autoComplete="off"
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
          >
            {/* Name Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                htmlFor="name-input"
                style={{
                  color: 'rgb(255, 255, 255)',
                  fontWeight: 500,
                  fontSize: '16px',
                  marginBottom: '2px',
                }}
              >
                Name*
              </label>
              <input
                id="name-input"
                name="name"
                placeholder="eg. John"
                required
                value={formData.name}
                onChange={handleChange}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
                style={{
                  width: '100%',
                  background: 'rgb(10, 15, 44)',
                  color: 'rgb(255, 255, 255)',
                  border: errors.name ? '1px solid rgb(239, 68, 68)' : '1px solid rgb(35, 42, 71)',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontWeight: 500,
                  outline: 'none',
                  marginBottom: '0px',
                  transition: 'border 0.2s, background 0.2s',
                  boxSizing: 'border-box',
                }}
              />
              {errors.name && (
                <span id="name-error" style={{ color: 'rgb(239, 68, 68)', fontSize: '14px' }}>
                  {errors.name}
                </span>
              )}
            </div>

            {/* Email Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                htmlFor="email-input"
                style={{
                  color: 'rgb(255, 255, 255)',
                  fontWeight: 500,
                  fontSize: '16px',
                  marginBottom: '2px',
                }}
              >
                Email*
              </label>
              <input
                id="email-input"
                name="email"
                placeholder="eg. johnfrans@gmail.com"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                style={{
                  width: '100%',
                  background: 'rgb(10, 15, 44)',
                  color: 'rgb(255, 255, 255)',
                  border: errors.email ? '1px solid rgb(239, 68, 68)' : '1px solid rgb(35, 42, 71)',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                  fontWeight: 500,
                  outline: 'none',
                  marginBottom: '0px',
                  transition: 'border 0.2s, background 0.2s',
                  boxSizing: 'border-box',
                }}
              />
              {errors.email && (
                <span id="email-error" style={{ color: 'rgb(239, 68, 68)', fontSize: '14px' }}>
                  {errors.email}
                </span>
              )}
            </div>

            {/* Phone Number Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                htmlFor="phonenumber-input"
                style={{
                  color: 'rgb(255, 255, 255)',
                  fontWeight: 500,
                  fontSize: '16px',
                  marginBottom: '2px',
                }}
              >
                Phone Number*
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0px',
                  position: 'relative',
                  width: '100%',
                }}
              >
                <div 
                  style={{ 
                    position: 'relative', 
                    width: `${countryCodeWidth}px`, 
                    minWidth: '110px',
                    transition: 'width 0.2s ease',
                  }}
                >
                  <select
                    ref={selectRef}
                    id="countryCode-select"
                    name="countryCode"
                    aria-label="Country code"
                    value={formData.countryCode}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      height: '48px',
                      background: 'rgb(10, 15, 44)',
                      color: 'rgb(255, 255, 255)',
                      border: '1px solid rgb(35, 42, 71)',
                      borderRadius: '16px 0px 0px 16px',
                      padding: '0px 32px 0px 16px',
                      fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                      fontWeight: 500,
                      outline: 'none',
                      appearance: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                    }}
                  >
                    {countryCodes.map((code) => (
                      <option key={code.value} value={code.value}>
                        {code.label}
                      </option>
                    ))}
                  </select>
                  <span
                    style={{
                      pointerEvents: 'none',
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgb(161, 168, 183)',
                      fontSize: '10px',
                    }}
                  >
                    ▼
                  </span>
                </div>
                <input
                  id="phonenumber-input"
                  name="phonenumber"
                  placeholder="Phone number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  type="tel"
                  required
                  value={formData.phonenumber}
                  onChange={handleChange}
                  aria-invalid={!!errors.phonenumber}
                  aria-describedby={errors.phonenumber ? 'phonenumber-error' : undefined}
                  style={{
                    flex: '1 1 0%',
                    height: '48px',
                    background: 'rgb(10, 15, 44)',
                    color: 'rgb(255, 255, 255)',
                    borderTop: '1px solid rgb(35, 42, 71)',
                    borderRight: '1px solid rgb(35, 42, 71)',
                    borderBottom: '1px solid rgb(35, 42, 71)',
                    borderLeft: 'none',
                    borderRadius: '0px 16px 16px 0px',
                    padding: '0px 16px',
                    fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                    fontWeight: 500,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              {errors.phonenumber && (
                <span id="phonenumber-error" style={{ color: 'rgb(239, 68, 68)', fontSize: '14px' }}>
                  {errors.phonenumber}
                </span>
              )}
            </div>

            {errors.submit && (
              <div style={{ color: 'rgb(239, 68, 68)', fontSize: '14px', textAlign: 'center' }}>
                {errors.submit}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '16px 0px',
                borderRadius: '12px',
                background: isSubmitting ? 'rgb(59, 130, 246)' : 'rgb(23, 99, 255)',
                color: 'rgb(255, 255, 255)',
                fontWeight: 600,
                fontSize: '17px',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: 'rgba(23, 99, 255, 0.1) 0px 2px 8px 0px',
                fontFamily: 'Inter, "Inter Placeholder", sans-serif',
                letterSpacing: '0.1px',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Next'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

