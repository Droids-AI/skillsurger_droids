export function phoneError(phone: string): string | undefined {
  if (!phone) return undefined;
  if (!/^\+[1-9]\d{6,14}$/.test(phone)) return 'Enter a phone number with country code, such as +91 9876543210, or leave this optional field blank.';
  if (phone.startsWith('+91') && !/^\+91[6-9]\d{9}$/.test(phone)) return 'For India, enter a 10-digit mobile number starting with 6, 7, 8, or 9.';
  return undefined;
}

export function validateAudit(input: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!String(input.fullName || '').trim() || String(input.fullName).length > 120) errors.fullName = 'Enter your full name (up to 120 characters).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(input.email || '').trim()) || String(input.email).length > 254) errors.email = 'Enter a valid email address.';
  const phone = phoneError(String(input.phoneNumber || '').replace(/[\s()-]/g, ''));
  if (phone) errors.phoneNumber = phone;
  if (!String(input.resumeStoragePath || '').match(/^[a-f0-9-]{36}\/[^/]+\.pdf$/i)) errors.resume = 'Upload your resume as a PDF.';
  if (String(input.yearsOfExperience || '').trim() && (!/^\d+(\.\d+)?$/.test(String(input.yearsOfExperience)) || Number(input.yearsOfExperience) > 60)) errors.yearsOfExperience = 'Enter your experience as a number from 0 to 60.';
  if (input.linkedinUrl && !/^https:\/\/(www\.)?linkedin\.com\/in\/[^\s]+$/i.test(String(input.linkedinUrl))) errors.linkedinUrl = 'Enter a LinkedIn profile URL starting with https://linkedin.com/in/.';
  return errors;
}
