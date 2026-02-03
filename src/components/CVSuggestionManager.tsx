import { useState, useEffect } from 'react';
import { Sparkles, Download, Plus, Edit3, Check, X, AlertCircle } from 'lucide-react';
import Button from './Button';
import { CVSuggestion } from '../lib/careerServices';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CVSuggestionManagerProps {
  suggestions: CVSuggestion;
  currentData: {
    summary: string;
    skills: string[];
    experience: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    projects: Array<{
      name: string;
      description: string;
      technologies: string[];
    }>;
    education?: Array<{
      degree: string;
      institution: string;
      year: string;
    }>;
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    languages?: string[];
    customSections?: Array<{
      title: string;
      content: string;
      type: 'text' | 'list' | 'experience';
    }>;
  };
  onAddCustomSection?: (section: { title: string; content: string; type: 'text' | 'list' | 'experience' }) => void;
  onAddCertification?: (certification: { name: string; issuer: string; date: string }) => void;
  onAddProject?: (project: { name: string; description: string; technologies: string[] }) => void;
  onGetEditedData?: (getData: () => { summary: string; experienceImprovements: Array<{ original: string; improved: string }> }) => void;
}

export default function CVSuggestionManager({
  suggestions,
  currentData,
  onAddCustomSection,
  onAddCertification,
  onAddProject,
  onGetEditedData
}: CVSuggestionManagerProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [editedSections, setEditedSections] = useState<Array<{ title: string; content: string; type: 'text' | 'list' | 'experience' }>>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isAddingSection, setIsAddingSection] = useState<number | null>(null);
  const [editingSummary, setEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState(suggestions.summary);
  const [editingExperience, setEditingExperience] = useState<number | null>(null);
  const [editedExperience, setEditedExperience] = useState<Array<{ original: string; improved: string }>>([]);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [isAddingCertification, setIsAddingCertification] = useState<number | null>(null);
  const [isAddingProject, setIsAddingProject] = useState<number | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Smart categorization function to detect suggestion type
  const categorizeSuggestion = (title: string, content: string): 'project' | 'certification' | 'custom' => {
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Check for project indicators
    const projectKeywords = ['project', 'developed', 'built', 'created', 'implemented', 'designed', 'architected', 'deployed', 'launched'];
    const hasProjectKeywords = projectKeywords.some(keyword => 
      titleLower.includes(keyword) || contentLower.includes(keyword)
    );
    
    // Check for certification indicators
    const certKeywords = ['certification', 'certified', 'certificate', 'license', 'credential', 'accreditation', 'aws', 'azure', 'google', 'microsoft'];
    const hasCertKeywords = certKeywords.some(keyword => 
      titleLower.includes(keyword) || contentLower.includes(keyword)
    );
    
    if (hasProjectKeywords && !hasCertKeywords) {
      return 'project';
    } else if (hasCertKeywords) {
      return 'certification';
    }
    
    return 'custom';
  };

  const handleEditSection = (index: number) => {
    setEditingSection(index);
    // Initialize edited section if not already edited
    if (!editedSections[index]) {
      setEditedSections(prev => {
        const newSections = [...prev];
        newSections[index] = { ...suggestions.additionalSections[index], type: 'text' as const };
        return newSections;
      });
    }
  };

  const handleSaveEdit = () => {
    setEditingSection(null);
    showFeedback('success', 'Section edited successfully!');
  };

  const handleCancelEdit = (index: number) => {
    setEditingSection(null);
    setEditedSections(prev => {
      const newSections = [...prev];
      newSections[index] = { ...suggestions.additionalSections[index], type: 'text' as const };
      return newSections;
    });
  };

  const handleAddSection = async (index: number) => {
    if (!onAddCustomSection) return;
    
    setIsAddingSection(index);
    try {
      const sectionToAdd = editedSections[index] || suggestions.additionalSections[index];
      
      // Ensure the section has a type field, default to 'text' if missing
      const sectionWithType = {
        ...sectionToAdd,
        type: sectionToAdd.type || 'text'
      };
      
      await onAddCustomSection(sectionWithType);
      
      // Mark this section as added
      setAddedItems(prev => new Set(prev).add(`section-${index}`));
      
      showFeedback('success', `"${sectionToAdd.title}" section added to your CV successfully!`);
    } catch (error) {
      showFeedback('error', 'Failed to add section to CV. Please try again.');
    } finally {
      setIsAddingSection(null);
    }
  };

  const handleAddCertification = async (index: number, certification?: any) => {
    if (!onAddCertification) return;
    
    setIsAddingCertification(index);
    try {
      const certificationToAdd = certification || suggestions.certifications?.[index];
      if (!certificationToAdd) return;
      
      await onAddCertification(certificationToAdd);
      
      // Mark this certification as added
      setAddedItems(prev => new Set(prev).add(`certification-${index}`));
      
      showFeedback('success', `"${certificationToAdd.name}" certification added to your CV successfully!`);
    } catch (error) {
      showFeedback('error', 'Failed to add certification to CV. Please try again.');
    } finally {
      setIsAddingCertification(null);
    }
  };

  const handleAddProject = async (index: number, project?: any) => {
    if (!onAddProject) return;
    
    setIsAddingProject(index);
    try {
      const projectToAdd = project || suggestions.projects?.[index];
      if (!projectToAdd) return;
      
      await onAddProject(projectToAdd);
      
      // Mark this project as added
      setAddedItems(prev => new Set(prev).add(`project-${index}`));
      
      showFeedback('success', `"${projectToAdd.name}" project added to your CV successfully!`);
    } catch (error) {
      showFeedback('error', 'Failed to add project to CV. Please try again.');
    } finally {
      setIsAddingProject(null);
    }
  };

  const handleEditSummary = () => {
    setEditingSummary(true);
  };

  const handleSaveSummary = () => {
    setEditingSummary(false);
    showFeedback('success', 'Summary edited successfully!');
  };

  const handleCancelSummary = () => {
    setEditingSummary(false);
    setEditedSummary(suggestions.summary);
  };

  const handleEditExperience = (index: number) => {
    setEditingExperience(index);
    if (!editedExperience[index]) {
      setEditedExperience(prev => {
        const newExperience = [...prev];
        newExperience[index] = { ...suggestions.experienceImprovements[index] };
        return newExperience;
      });
    }
  };

  const handleSaveExperience = () => {
    setEditingExperience(null);
    showFeedback('success', 'Experience enhancement edited successfully!');
  };

  const handleCancelExperience = (index: number) => {
    setEditingExperience(null);
    setEditedExperience(prev => {
      const newExperience = [...prev];
      newExperience[index] = { ...suggestions.experienceImprovements[index] };
      return newExperience;
    });
  };

  // Expose edited data to parent component
  useEffect(() => {
    if (onGetEditedData) {
      onGetEditedData(() => ({
        summary: editedSummary,
        experienceImprovements: editedExperience.length > 0 
          ? editedExperience 
          : suggestions.experienceImprovements.map(imp => ({ ...imp }))
      }));
    }
  }, [editedSummary, editedExperience, suggestions.experienceImprovements, onGetEditedData]);

  const handleDownloadOptimizedCV = async () => {
    try {
      setIsDownloading(true);

      // Find the CV preview element
      const cvPreviewElement = document.getElementById('cv-preview');
      if (!cvPreviewElement) {
        console.error('CV preview element not found');
        throw new Error('CV preview element not found');
      }

      // Wait a bit for any dynamic content to render
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('CV Element found:', cvPreviewElement);
      console.log('CV Element dimensions:', {
        width: cvPreviewElement.offsetWidth,
        height: cvPreviewElement.offsetHeight,
        scrollWidth: cvPreviewElement.scrollWidth,
        scrollHeight: cvPreviewElement.scrollHeight
      });

      // Use html2canvas to capture the actual rendered CV preview
      const canvas = await html2canvas(cvPreviewElement, {
        scale: 1.5, // Reduced scale for smaller file size
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: cvPreviewElement.scrollWidth,
        height: cvPreviewElement.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        logging: true, // Enable logging to debug
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

      // Download the PDF
      const fullName = currentData.fullName || 'CV';
      const fileName = `${fullName.replace(/\s+/g, '_')}_Enhanced_CV.pdf`;
      pdf.save(fileName);
      
      console.log('PDF saved successfully');

    } catch (error) {
      console.error('Error generating optimized CV PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* Feedback Messages */}
      {feedback && (
        <div className={`p-4 rounded-lg border flex items-center ${
          feedback.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success' ? (
            <Check className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          {feedback.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
          AI-Powered CV Enhancement Suggestions
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleDownloadOptimizedCV}
            disabled={isDownloading}
            className="flex items-center"
            >
              <Download className={`w-4 h-4 mr-2 ${isDownloading ? 'animate-spin' : ''}`} />
              {isDownloading ? 'Generating...' : 'Download Enhanced CV'}
            </Button>
        </div>
      </div>

      {/* Professional Summary Suggestion */}
      <div className="border rounded-lg p-6 border-blue-200 bg-blue-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-gray-900 ml-2">Enhanced Professional Summary</h4>
          </div>
          {!editingSummary && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditSummary}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Edit
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-2">Current Summary:</p>
            <div className="p-3 bg-gray-100 rounded border">
              <p className="text-gray-700">{currentData.summary || 'No summary provided'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">AI-Enhanced Version (adds to existing):</p>
            {editingSummary ? (
              <div className="space-y-3">
                <textarea
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 min-h-[120px] resize-y"
                  placeholder="Enhanced professional summary"
                />
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveSummary}
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelSummary}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
            <div className="p-3 bg-white rounded border border-blue-200">
                <p className="text-gray-700 font-medium">{editedSummary}</p>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Skills Optimization */}
      <div className="border rounded-lg p-6 border-blue-200 bg-blue-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-gray-900 ml-2">Additional Skills to Add</h4>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-2">Current Skills:</p>
            <div className="flex flex-wrap gap-2">
              {currentData.skills.map((skill, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2">AI-Recommended Additional Skills:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.highlightedSkills.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* No acceptance/rejection for skills */}
      </div>

      {/* Experience Improvements */}
      {suggestions.experienceImprovements.length > 0 && (
        <div className="border rounded-lg p-6 border-blue-200 bg-blue-50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900 ml-2">Experience Enhancements</h4>
            </div>
          </div>

          <div className="space-y-4">
            {suggestions.experienceImprovements.map((improvement, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between mb-3">
                  <h5 className="font-medium text-gray-900">Experience Enhancement #{index + 1}</h5>
                  {editingExperience !== index && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditExperience(index)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Original:</p>
                    <p className="text-gray-700 text-sm">{improvement.original}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">AI-Enhanced Addition (adds to original):</p>
                    {editingExperience === index ? (
                      <div className="space-y-3">
                        <textarea
                          value={editedExperience[index]?.improved || improvement.improved}
                          onChange={(e) => {
                            setEditedExperience(prev => {
                              const newExperience = [...prev];
                              if (!newExperience[index]) newExperience[index] = { ...improvement };
                              newExperience[index].improved = e.target.value;
                              return newExperience;
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 min-h-[100px] resize-y"
                          placeholder="Enhanced experience description"
                        />
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSaveExperience}
                            className="text-green-600 border-green-300 hover:bg-green-50"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelExperience(index)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                    <p className="text-gray-700 font-medium text-sm bg-blue-50 p-3 rounded border">
                        {editedExperience[index]?.improved || improvement.improved}
                    </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No acceptance/rejection for experience */}
        </div>
      )}

      {/* Additional Sections */}
      {suggestions.additionalSections.length > 0 && (
        <div className="border rounded-lg p-6 border-blue-200 bg-blue-50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900 ml-2">Suggested Additional Sections</h4>
            </div>
          </div>

          <div className="space-y-4">
            {suggestions.additionalSections.map((section, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between mb-3">
                  <h5 className="font-medium text-gray-900">
                    {editingSection === index ? (
                      <input
                        type="text"
                        value={editedSections[index]?.title || section.title}
                        onChange={(e) => {
                          setEditedSections(prev => {
                            const newSections = [...prev];
                            if (!newSections[index]) newSections[index] = { ...section, type: 'text' as const };
                            newSections[index].title = e.target.value;
                            return newSections;
                          });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-medium"
                        placeholder="Section title"
                      />
                    ) : (
                      section.title
                    )}
                  </h5>
                  <div className="flex items-center space-x-2">
                    {editingSection === index ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSaveEdit}
                          className="text-green-600 border-green-300 hover:bg-green-50"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelEdit(index)}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSection(index)}
                          className="text-blue-600 border-blue-300 hover:bg-blue-50"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const section = editedSections[index] || suggestions.additionalSections[index];
                            const category = categorizeSuggestion(section.title, section.content);
                            
                            if (category === 'project' && onAddProject) {
                              // Convert to project format
                              const project = {
                                name: section.title,
                                description: section.content,
                                technologies: [] // Could be enhanced to extract technologies from content
                              };
                              handleAddProject(index, project);
                            } else if (category === 'certification' && onAddCertification) {
                              // Convert to certification format
                              const certification = {
                                name: section.title,
                                issuer: 'To be specified', // Could be enhanced to extract from content
                                date: 'To be specified' // Could be enhanced to extract from content
                              };
                              handleAddCertification(index, certification);
                            } else {
                              // Default to custom section
                              handleAddSection(index);
                            }
                          }}
                          disabled={isAddingSection === index || addedItems.has(`section-${index}`)}
                          className={
                            addedItems.has(`section-${index}`)
                              ? "text-green-600 border-green-300 bg-green-50 cursor-default"
                              : "text-green-600 border-green-300 hover:bg-green-50"
                          }
                        >
                          {isAddingSection === index ? (
                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                          ) : addedItems.has(`section-${index}`) ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          {addedItems.has(`section-${index}`) ? 'Added' : 'Add to CV'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                {editingSection === index ? (
                  <textarea
                    value={editedSections[index]?.content || section.content}
                    onChange={(e) => {
                      setEditedSections(prev => {
                        const newSections = [...prev];
                        if (!newSections[index]) newSections[index] = { ...section, type: 'text' as const };
                        newSections[index].content = e.target.value;
                        return newSections;
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 min-h-[100px] resize-y"
                    placeholder="Section content"
                  />
                ) : (
                <p className="text-gray-700 text-sm">{section.content}</p>
                )}
              </div>
            ))}
          </div>

          {/* No acceptance/rejection for sections */}
        </div>
      )}

      {/* Certifications */}
      {suggestions.certifications && suggestions.certifications.length > 0 && (
        <div className="border rounded-lg p-6 border-green-200 bg-green-50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <Sparkles className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-gray-900 ml-2">Suggested Certifications</h4>
            </div>
          </div>

          <div className="space-y-4">
            {suggestions.certifications.map((certification, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900">{certification.name}</h5>
                    <p className="text-sm text-gray-600">Issued by: {certification.issuer}</p>
                    <p className="text-sm text-gray-500">Date: {certification.date}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddCertification(index)}
                      disabled={isAddingCertification === index || addedItems.has(`certification-${index}`)}
                      className={
                        addedItems.has(`certification-${index}`)
                          ? "text-green-600 border-green-300 bg-green-50 cursor-default"
                          : "text-green-600 border-green-300 hover:bg-green-50"
                      }
                    >
                      {isAddingCertification === index ? (
                        <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                      ) : addedItems.has(`certification-${index}`) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      {addedItems.has(`certification-${index}`) ? 'Added' : 'Add to CV'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {suggestions.projects && suggestions.projects.length > 0 && (
        <div className="border rounded-lg p-6 border-purple-200 bg-purple-50">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-gray-900 ml-2">Suggested Projects</h4>
            </div>
          </div>

          <div className="space-y-4">
            {suggestions.projects.map((project, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900">{project.name}</h5>
                    <p className="text-sm text-gray-700 mt-2">{project.description}</p>
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.technologies.map((tech, techIndex) => (
                          <span key={techIndex} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddProject(index)}
                      disabled={isAddingProject === index || addedItems.has(`project-${index}`)}
                      className={
                        addedItems.has(`project-${index}`)
                          ? "text-purple-600 border-purple-300 bg-purple-50 cursor-default"
                          : "text-purple-600 border-purple-300 hover:bg-purple-50"
                      }
                    >
                      {isAddingProject === index ? (
                        <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                      ) : addedItems.has(`project-${index}`) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      {addedItems.has(`project-${index}`) ? 'Added' : 'Add to CV'}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary of Changes */}
      {/* No summary of changes section as acceptance/rejection is removed */}
    </div>
  );
}