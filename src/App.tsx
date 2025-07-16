import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Upload, AlertTriangle, CheckCircle, FileText, Shield, TrendingUp } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface AnalysisResult {
  riskScore: number;
  redFlagsAnalysis: string[];
  strategicRecommendation: string[];
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => ('str' in item ? item.str : '')).join(' ') + '\n';
    }
    return fullText;
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setAnalysisResult(null);
    setError(null);

    try {
      const resumeText = await extractTextFromPdf(selectedFile);
      if (!resumeText.trim()) throw new Error("Could not extract text from the PDF.");

      const response = await fetch('https://prismatic-kleicha-a78d12.netlify.app/.netlify/functions/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalysisResult(data);

    } catch (err: any) {
      console.error("Analysis failed:", err);
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const CircularProgress = ({ score }: { score: number }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const isHighRisk = score > 33;

    return (
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} stroke="#E5E7EB" strokeWidth="8" fill="none" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={isHighRisk ? "#EF4444" : "#10B981"}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-semibold ${isHighRisk ? 'text-red-600' : 'text-green-600'}`}>{score}</span>
          <span className="text-sm text-gray-600">Risk Score</span>
        </div>
      </div>
    );
  };

  // RENDER LOGIC
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#2563EB] mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-[#1F2937] mb-2">Analyzing Resume...</h2>
          <p className="text-[#6B7280]">Extracting text and scanning for authenticity markers...</p>
        </div>
      </div>
    );
  }

  if (!isLoading && analysisResult) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-semibold text-[#1F2937] mb-4">Resume Authenticity Report</h2>
            <div className="flex justify-center mb-6">
              <CircularProgress score={analysisResult.riskScore} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Danger Column */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-[#EF4444] mr-2" />
                <h3 className="text-2xl font-semibold text-[#1F2937]">Potential Red Flags Detected</h3>
              </div>
              {analysisResult.redFlagsAnalysis && Array.isArray(analysisResult.redFlagsAnalysis) ? (
                <ul className="space-y-4">
                  {analysisResult.redFlagsAnalysis.map((point, index) => (
                    // THE FIX: Added a flex container and a colored dot span
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <div className="text-[#1F2937] leading-relaxed"><ReactMarkdown>{point.replace('•', '')}</ReactMarkdown></div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#6B7280]">No detailed red flags were provided in the analysis.</p>
              )}
            </div>
            {/* Solution Column */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-[#2563EB] mr-2" />
                <h3 className="text-2xl font-semibold text-[#1F2937]">Recommended Next Steps</h3>
              </div>
              {analysisResult.strategicRecommendation && Array.isArray(analysisResult.strategicRecommendation) ? (
                <ul className="space-y-4">
                  {analysisResult.strategicRecommendation.map((point, index) => (
                    // THE FIX: Added a flex container and a colored dot span
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <div className="text-[#1F2937] leading-relaxed"><ReactMarkdown>{point.replace('•', '')}</ReactMarkdown></div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[#6B7280]">No specific recommendations were provided.</p>
              )}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-semibold text-[#1F2937] mb-4">These Red Flags Are Just the Tip of the Iceberg.</h3>
            <p className="text-[#6B7280] mb-6 max-w-2xl mx-auto">A single bad hire can cost you thousands. This report shows the risk in one resume—imagine what's hiding in your entire pipeline. In a free Pipeline Risk Audit, I'll help you build a system to eliminate these threats for good.</p>
            <a href="https://calendar.app.google/aHLFmdTNFsM8gK958" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-8 py-3 bg-[#2563EB] text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200">
              <Shield className="w-5 h-5 mr-2" />
              Book Your Free Pipeline Audit
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold text-[#1F2937] mb-6 leading-tight">
            Stop Drowning in Fake Resumes.
          </h1>
          {/* THE FIX: Updated subheadline copy */}
          <p className="text-xl text-[#6B7280] leading-relaxed">
            For recruiters buried under a mountain of unqualified applicants, our tool automatically detects AI-generated content and verifies claims. Identify the risks INSTANTLY.
          </p>
        </div>

        {/* Main Upload Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
          {/* THE FIX: Removed redundant H2 and P tags */}
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert"><strong className="font-bold">Error: </strong><span className="block sm:inline">{error}</span></div>}
          <div className="mb-6">
            <label className="block">
              <input type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#2563EB] transition-colors duration-200">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {selectedFile ? (
                  <div className="flex items-center justify-center"><FileText className="w-5 h-5 text-[#2563EB] mr-2" /><span className="text-[#1F2937] font-medium">{selectedFile.name}</span></div>
                ) : (
                  <><p className="text-[#6B7280] mb-2"><span className="font-medium">Click to upload</span> or drag and drop</p><p className="text-sm text-[#6B7280]">PDF files only</p></>
                )}
              </div>
            </label>
          </div>
          <button onClick={handleAnalyze} disabled={!selectedFile || isLoading} className={`w-full py-3 px-6 rounded-lg font-medium transition-colors duration-200 ${selectedFile && !isLoading ? 'bg-[#2563EB] text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            <TrendingUp className="w-5 h-5 inline mr-2" />
            Analyze Resume
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;