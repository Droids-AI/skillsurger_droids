import { useState, useEffect } from 'react';
import { Download, Plus, Trash2, Edit2, Save, X, Sparkles } from 'lucide-react';
import Button from './Button';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import GenerateCVModal from './GenerateCVModal';
import { generateFresherCVFromProfile } from '../lib/careerServices';

interface CVData {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
    technologies?: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  skills: string[];
  languages: string[];
  certifications?: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  awards?: Array<{
    title: string;
    issuer: string;
    date: string;
  }>;
  publications?: Array<{
    title: string;
    journal: string;
    date: string;
  }>;
  volunteerWork?: Array<{
    organization: string;
    role: string;
    duration: string;
    description: string;
  }>;
  customSections?: Array<{
    title: string;
    content: string;
    type: 'text' | 'list' | 'experience';
  }>;
}

interface Props {
  initialData: CVData;
  onSave: (data: CVData) => Promise<void>;
  hideSummaryInPreview?: boolean;
  userType?: 'experienced' | 'fresher';
  profileData?: any;
}

export default function CVEditor({ initialData, onSave, userType, profileData }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<CVData>(initialData);
  const [loading, setLoading] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatingCV, setGeneratingCV] = useState(false);
  
  // Store raw input strings for comma-separated fields to preserve commas while typing
  const [skillsInput, setSkillsInput] = useState('');
  const [languagesInput, setLanguagesInput] = useState('');

  // Sync state with initialData prop changes
  useEffect(() => {
    setData(initialData);
    // Initialize input strings from data
    setSkillsInput(Array.isArray(initialData.skills) ? initialData.skills.join(', ') : '');
    setLanguagesInput(Array.isArray(initialData.languages) ? initialData.languages.join(', ') : '');
  }, [initialData]);

  const handleGenerateCV = async (interests: string) => {
    if (!profileData) return;
    
    setGeneratingCV(true);
    try {
      const generatedCV = await generateFresherCVFromProfile(profileData, interests);
      
      // Merge the generated CV with existing data
      const updatedData: CVData = {
        ...data,
        summary: generatedCV.summary || data.summary,
        projects: [...(data.projects || []), ...(generatedCV.projects || [])],
        skills: [...new Set([...(data.skills || []), ...(generatedCV.skills || [])])],
        certifications: [...(data.certifications || []), ...(generatedCV.certifications || [])],
        awards: [...(data.awards || []), ...(generatedCV.awards || [])],
        volunteerWork: [...(data.volunteerWork || []), ...(generatedCV.volunteerWork || [])],
        customSections: [...(data.customSections || []), ...(generatedCV.customSections || [])],
        languages: [...new Set([...(data.languages || []), ...(generatedCV.languages || [])])]
      };
      
      setData(updatedData);
      setShowGenerateModal(false);
      
      // Automatically save the generated CV to the database
      try {
        await onSave(updatedData);
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successDiv.textContent = 'CV generated and saved successfully!';
        document.body.appendChild(successDiv);
        setTimeout(() => {
          if (document.body.contains(successDiv)) {
            document.body.removeChild(successDiv);
          }
        }, 3000);
      } catch (saveError) {
        console.error('Error auto-saving generated CV:', saveError);
        
        // Show warning message that CV was generated but not saved
        const warningDiv = document.createElement('div');
        warningDiv.className = 'fixed top-4 right-4 bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        warningDiv.textContent = 'CV generated successfully! Please save your changes manually.';
        document.body.appendChild(warningDiv);
        setTimeout(() => {
          if (document.body.contains(warningDiv)) {
            document.body.removeChild(warningDiv);
          }
        }, 5000);
      }
    } catch (error) {
      console.error('Error generating CV:', error);
      
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorDiv.textContent = 'Failed to generate CV. Please try again.';
      document.body.appendChild(errorDiv);
      setTimeout(() => {
        if (document.body.contains(errorDiv)) {
          document.body.removeChild(errorDiv);
        }
      }, 5000);
    } finally {
      setGeneratingCV(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Parse skills and languages from input strings before saving
      const parsedSkills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
      const parsedLanguages = languagesInput.split(',').map(l => l.trim()).filter(Boolean);
      
      const updatedData = {
        ...data,
        skills: parsedSkills,
        languages: parsedLanguages
      };
      
      await onSave(updatedData);
      setIsEditing(false);
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'CV changes saved successfully!';
      document.body.appendChild(successDiv);
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);
    } catch (error) {
      console.error('Error saving CV:', error);
      
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorDiv.textContent = 'Failed to save CV changes. Please try again.';
      document.body.appendChild(errorDiv);
      setTimeout(() => {
        if (document.body.contains(errorDiv)) {
          document.body.removeChild(errorDiv);
        }
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      const cvElement = document.getElementById('cv-preview');
      if (!cvElement) {
        console.error('CV preview element not found');
        return;
      }

      // Wait a bit for any dynamic content to render
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('CV Element found:', cvElement);
      console.log('CV Element dimensions:', {
        width: cvElement.offsetWidth,
        height: cvElement.offsetHeight,
        scrollWidth: cvElement.scrollWidth,
        scrollHeight: cvElement.scrollHeight
      });

      const canvas = await html2canvas(cvElement, {
        scale: 1.5, // Reduced scale for smaller file size
        logging: true, // Enable logging to debug
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: cvElement.scrollWidth,
        height: cvElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        imageTimeout: 0,
        removeContainer: true,
        ignoreElements: (element) => {
          return element.classList.contains('no-print');
        }
      });

      console.log('Canvas created:', {
        width: canvas.width,
        height: canvas.height
      });

      // Create PDF with custom dimensions to fit all content
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [210, canvas.height * 210 / canvas.width] // Custom height to fit content
      });
      
      // Convert to JPEG for smaller file size
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      
      // Add image to PDF - full size to fit all content
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, canvas.height * 210 / canvas.width);
      
      // Save with optimized filename
      const fileName = `${data.fullName.replace(/\s+/g, '_')}_CV.pdf`;
      pdf.save(fileName);
      
      console.log('PDF saved successfully');
      
      // Show success message
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successDiv.textContent = 'CV PDF downloaded successfully!';
      document.body.appendChild(successDiv);
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 3000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Show error message
      const errorDiv = document.createElement('div');
      errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      errorDiv.textContent = 'Failed to generate CV PDF. Please try again.';
      document.body.appendChild(errorDiv);
      setTimeout(() => {
        if (document.body.contains(errorDiv)) {
          document.body.removeChild(errorDiv);
        }
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit CV</h3>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                value={data.fullName}
                onChange={(e) => setData({ ...data, fullName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Professional Title</label>
              <input
                type="text"
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => setData({ ...data, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                value={data.location}
                onChange={(e) => setData({ ...data, location: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="City, State, Country"
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Professional Summary</label>
            <textarea
              value={data.summary}
              onChange={(e) => setData({ ...data, summary: e.target.value })}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Experience */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">Experience</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setData({
                  ...data,
                  experience: [
                    ...data.experience,
                    { title: '', company: '', duration: '', description: '' }
                  ]
                })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Experience
              </Button>
            </div>
            <div className="space-y-4">
              {data.experience.map((exp, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-4">
                    <h4 className="font-medium">Experience #{index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setData({
                        ...data,
                        experience: data.experience.filter((_, i) => i !== index)
                      })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => {
                          const newExp = [...data.experience];
                          newExp[index] = { ...exp, title: e.target.value };
                          setData({ ...data, experience: newExp });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const newExp = [...data.experience];
                          newExp[index] = { ...exp, company: e.target.value };
                          setData({ ...data, experience: newExp });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Duration</label>
                      <input
                        type="text"
                        value={exp.duration}
                        onChange={(e) => {
                          const newExp = [...data.experience];
                          newExp[index] = { ...exp, duration: e.target.value };
                          setData({ ...data, experience: newExp });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., Jan 2020 - Present"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={exp.description}
                      onChange={(e) => {
                        const newExp = [...data.experience];
                        newExp[index] = { ...exp, description: e.target.value };
                        setData({ ...data, experience: newExp });
                      }}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Technologies Used</label>
                    <input
                      type="text"
                      defaultValue={Array.isArray(exp.technologies) ? exp.technologies.join(', ') : ''}
                      onBlur={(e) => {
                        // Only parse when user leaves the field
                        const newExp = [...data.experience];
                        newExp[index] = { 
                          ...exp, 
                          technologies: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                        };
                        setData({ ...data, experience: newExp });
                      }}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., React, Node.js, Python"
                    />
                    <p className="text-xs text-gray-500 mt-1">Type freely - we'll separate by commas when you save</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">Projects</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setData({
                  ...data,
                  projects: [
                    ...data.projects,
                    { name: '', description: '', technologies: [] }
                  ]
                })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </div>
            <div className="space-y-4">
              {data.projects.map((project, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-4">
                    <h4 className="font-medium">Project #{index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setData({
                        ...data,
                        projects: data.projects.filter((_, i) => i !== index)
                      })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        value={project.name}
                        onChange={(e) => {
                          const newProjects = [...data.projects];
                          newProjects[index] = { ...project, name: e.target.value };
                          setData({ ...data, projects: newProjects });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={project.description}
                        onChange={(e) => {
                          const newProjects = [...data.projects];
                          newProjects[index] = { ...project, description: e.target.value };
                          setData({ ...data, projects: newProjects });
                        }}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Technologies</label>
                      <input
                        type="text"
                        defaultValue={Array.isArray(project.technologies) ? project.technologies.join(', ') : ''}
                        onBlur={(e) => {
                          // Only parse when user leaves the field
                          const newProjects = [...data.projects];
                          newProjects[index] = {
                            ...project,
                            technologies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                          };
                          setData({ ...data, projects: newProjects });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., React, Node.js, MongoDB"
                      />
                      <p className="text-xs text-gray-500 mt-1">Type freely - we'll separate by commas when you save</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">Education</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setData({
                  ...data,
                  education: [
                    ...data.education,
                    { degree: '', institution: '', year: '' }
                  ]
                })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Education
              </Button>
            </div>
            <div className="space-y-4">
              {data.education.map((edu, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-4">
                    <h4 className="font-medium">Education #{index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setData({
                        ...data,
                        education: data.education.filter((_, i) => i !== index)
                      })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Degree</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const newEdu = [...data.education];
                          newEdu[index] = { ...edu, degree: e.target.value };
                          setData({ ...data, education: newEdu });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Institution</label>
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => {
                          const newEdu = [...data.education];
                          newEdu[index] = { ...edu, institution: e.target.value };
                          setData({ ...data, education: newEdu });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Year</label>
                      <input
                        type="text"
                        value={edu.year}
                        onChange={(e) => {
                          const newEdu = [...data.education];
                          newEdu[index] = { ...edu, year: e.target.value };
                          setData({ ...data, education: newEdu });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Skills</label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., JavaScript, React, Node.js, Python"
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 mt-1">Type freely - we'll separate by commas when you save</p>
          </div>

          {/* Languages */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Languages</label>
            <input
              type="text"
              value={languagesInput}
              onChange={(e) => setLanguagesInput(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., English, Spanish, Mandarin"
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 mt-1">Type freely - we'll separate by commas when you save</p>
          </div>

          {/* Certifications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">Certifications</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setData({
                  ...data,
                  certifications: [
                    ...(data.certifications || []),
                    { name: '', issuer: '', date: '' }
                  ]
                })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Certification
              </Button>
            </div>
            <div className="space-y-4">
              {(data.certifications || []).map((cert, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-4">
                    <h4 className="font-medium">Certification #{index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setData({
                        ...data,
                        certifications: (data.certifications || []).filter((_, i) => i !== index)
                      })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Certification Name</label>
                      <input
                        type="text"
                        value={cert.name}
                        onChange={(e) => {
                          const newCerts = [...(data.certifications || [])];
                          newCerts[index] = { ...cert, name: e.target.value };
                          setData({ ...data, certifications: newCerts });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Issuer</label>
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) => {
                          const newCerts = [...(data.certifications || [])];
                          newCerts[index] = { ...cert, issuer: e.target.value };
                          setData({ ...data, certifications: newCerts });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="text"
                        value={cert.date}
                        onChange={(e) => {
                          const newCerts = [...(data.certifications || [])];
                          newCerts[index] = { ...cert, date: e.target.value };
                          setData({ ...data, certifications: newCerts });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., Jan 2023"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Awards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">Awards</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setData({
                  ...data,
                  awards: [
                    ...(data.awards || []),
                    { title: '', issuer: '', date: '' }
                  ]
                })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Award
              </Button>
            </div>
            <div className="space-y-4">
              {(data.awards || []).map((award, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-4">
                    <h4 className="font-medium">Award #{index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setData({
                        ...data,
                        awards: (data.awards || []).filter((_, i) => i !== index)
                      })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Award Title</label>
                      <input
                        type="text"
                        value={award.title}
                        onChange={(e) => {
                          const newAwards = [...(data.awards || [])];
                          newAwards[index] = { ...award, title: e.target.value };
                          setData({ ...data, awards: newAwards });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Issuer</label>
                      <input
                        type="text"
                        value={award.issuer}
                        onChange={(e) => {
                          const newAwards = [...(data.awards || [])];
                          newAwards[index] = { ...award, issuer: e.target.value };
                          setData({ ...data, awards: newAwards });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="text"
                        value={award.date}
                        onChange={(e) => {
                          const newAwards = [...(data.awards || [])];
                          newAwards[index] = { ...award, date: e.target.value };
                          setData({ ...data, awards: newAwards });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., Jan 2023"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Sections */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">Custom Sections</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setData({
                  ...data,
                  customSections: [
                    ...(data.customSections || []),
                    { title: '', content: '', type: 'text' }
                  ]
                })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Section
              </Button>
            </div>
            <div className="space-y-4">
              {(data.customSections || []).map((section, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-4">
                    <h4 className="font-medium">Custom Section #{index + 1}</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setData({
                        ...data,
                        customSections: (data.customSections || []).filter((_, i) => i !== index)
                      })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Section Title</label>
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => {
                          const newSections = [...(data.customSections || [])];
                          newSections[index] = { ...section, title: e.target.value };
                          setData({ ...data, customSections: newSections });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        placeholder="e.g., Publications, Volunteer Work"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Section Type</label>
                      <select
                        value={section.type}
                        onChange={(e) => {
                          const newSections = [...(data.customSections || [])];
                          newSections[index] = { ...section, type: e.target.value as 'text' | 'list' | 'experience' };
                          setData({ ...data, customSections: newSections });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="text">Text Content</option>
                        <option value="list">List Items</option>
                        <option value="experience">Experience Format</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Content</label>
                    <textarea
                      value={section.content}
                      onChange={(e) => {
                        const newSections = [...(data.customSections || [])];
                        newSections[index] = { ...section, content: e.target.value };
                        setData({ ...data, customSections: newSections });
                      }}
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder={
                        section.type === 'text' 
                          ? 'Enter your content here...'
                          : section.type === 'list'
                          ? 'Enter list items, one per line...'
                          : 'Enter experience details...'
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-6 border-t border-gray-200 mt-8">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
        </div>
      </div>

      {/* Generate CV Modal */}
      <GenerateCVModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerateCV}
        loading={generatingCV}
      />
    </div>
  );
}

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">CV Preview</h3>
        <div className="flex space-x-2">
          {userType === 'fresher' && (
            <Button 
              variant="outline" 
              onClick={() => setShowGenerateModal(true)}
              className="border-green-500 text-green-600 hover:bg-green-50"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate CV
            </Button>
          )}
          <Button variant="outline" onClick={() => {
            setIsEditing(true);
            // Sync input states when entering edit mode
            setSkillsInput(Array.isArray(data.skills) ? data.skills.join(', ') : '');
            setLanguagesInput(Array.isArray(data.languages) ? data.languages.join(', ') : '');
          }}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit CV
          </Button>
          <Button onClick={handleDownloadPDF} disabled={loading}>
            <Download className="w-4 h-4 mr-2" />
            {loading ? 'Generating PDF...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      <div id="cv-preview" className="bg-white p-8 shadow-lg rounded-lg max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif', lineHeight: '1.6' }}>
        {/* Header */}
        <div className="text-center mb-10 pb-6 border-b-2 border-blue-600">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{data.fullName}</h1>
          <p className="text-xl text-blue-600 font-semibold mb-3">{data.title}</p>
          <div className="flex items-center justify-center space-x-6 mt-4 text-gray-600 text-sm">
            {data.email && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span>{data.email}</span>
              </div>
            )}
            {data.phone && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span>{data.phone}</span>
              </div>
            )}
            {data.location && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <span>{data.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        {data.summary && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <div className="w-8 h-1 bg-blue-600 mr-3"></div>
              Professional Summary
            </h2>
            <p className="text-gray-700 leading-relaxed text-lg">{data.summary}</p>
          </div>
        )}

        {/* Experience */}
        {data.experience.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
              <div className="w-8 h-1 bg-blue-600 mr-3"></div>
              Professional Experience
            </h2>
            <div className="space-y-0">
              {data.experience.map((exp, index) => (
                <div key={index} className="border-l-4 border-blue-200 pl-6 mb-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{exp.title}</h3>
                      <p className="text-blue-600 font-medium">{exp.company}</p>
                    </div>
                    <div className="flex-shrink-0 text-right min-w-[140px] flex justify-end">
                      <span className="text-gray-500 font-medium bg-gray-100 px-4 py-2 rounded-full text-xs inline-block text-center whitespace-nowrap">
                        {exp.duration}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed text-sm">{exp.description}</p>
                  {exp.technologies && exp.technologies.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {exp.technologies.map((tech, techIndex) => (
                        <span key={techIndex} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {data.projects.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-1 bg-blue-600 mr-3"></div>
              Projects
            </h2>
            <div className="space-y-6">
              {data.projects.map((project, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-3">{project.description}</p>
                  {project.technologies && Array.isArray(project.technologies) && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm font-medium text-gray-600">Technologies:</span>
                      {project.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
              <div className="w-8 h-1 bg-blue-600 mr-3"></div>
              Education
            </h2>
            <div className="space-y-0">
              {data.education.map((edu, index) => (
                <div key={index} className="flex justify-between items-start bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="flex-1 pr-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{edu.degree}</h3>
                    <p className="text-blue-600 font-medium">{edu.institution}</p>
                  </div>
                  <div className="flex-shrink-0 text-right min-w-[140px] flex justify-end">
                    <span className="text-gray-500 font-medium bg-white px-4 py-2 rounded-full text-xs border inline-block text-center whitespace-nowrap">
                      {edu.year}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <div className="w-8 h-1 bg-blue-600 mr-3"></div>
              Skills
            </h2>
            <div className="flex flex-wrap gap-3">
              {data.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {data.languages.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
              <div className="w-8 h-1 bg-blue-600 mr-3"></div>
              Languages
            </h2>
            <div className="flex flex-wrap gap-3">
              {data.languages.map((language, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                >
                  {language}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
              <div className="w-8 h-1 bg-blue-600 mr-3"></div>
              Certifications
            </h2>
            <div className="space-y-4">
              {data.certifications.map((cert, index) => (
                <div key={index} className="flex justify-between items-start bg-gray-50 p-4 rounded-lg">
                  <div className="flex-1 pr-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{cert.name}</h3>
                    <p className="text-blue-600 font-medium">{cert.issuer}</p>
                  </div>
                  <div className="flex-shrink-0 text-right min-w-[140px] flex justify-end">
                    <span className="text-gray-500 font-medium bg-white px-4 py-2 rounded-full text-xs border inline-block text-center whitespace-nowrap">
                      {cert.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Awards */}
        {data.awards && data.awards.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
              <div className="w-8 h-1 bg-blue-600 mr-3"></div>
              Awards
            </h2>
            <div className="space-y-4">
              {data.awards.map((award, index) => (
                <div key={index} className="flex justify-between items-start bg-gray-50 p-4 rounded-lg">
                  <div className="flex-1 pr-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{award.title}</h3>
                    <p className="text-blue-600 font-medium">{award.issuer}</p>
                  </div>
                  <div className="flex-shrink-0 text-right min-w-[140px] flex justify-end">
                    <span className="text-gray-500 font-medium bg-white px-4 py-2 rounded-full text-xs border inline-block text-center whitespace-nowrap">
                      {award.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Sections */}
        {data.customSections && data.customSections.length > 0 && (
          <>
            {data.customSections.map((section, index) => (
              <div key={index} className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <div className="w-8 h-1 bg-blue-600 mr-3"></div>
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.type === 'text' && (
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">{section.content}</p>
                    </div>
                  )}
                  {section.type === 'list' && (
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <ul className="list-disc list-inside space-y-2">
                        {section.content.split('\n').filter(item => item.trim()).map((item, itemIndex) => (
                          <li key={itemIndex} className="text-gray-700">{item.trim()}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {section.type === 'experience' && (
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <p className="text-gray-700 leading-relaxed">{section.content}</p>
                    </div>
                  )}
                  {!section.type && (
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <p className="text-gray-700 leading-relaxed">{section.content}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Generate CV Modal */}
      <GenerateCVModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerateCV}
        loading={generatingCV}
      />
    </div>
  );
}