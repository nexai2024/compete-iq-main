'use client';

import { useState } from 'react';
import { FileText, Download, Loader2, CheckCircle } from 'lucide-react';

interface ExportCenterProps {
  analysisId: string;
  analysisName: string;
}

export function ExportCenter({ analysisId, analysisName }: ExportCenterProps) {
  const [isDownloadingMarkdown, setIsDownloadingMarkdown] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const downloadMarkdown = async () => {
    setIsDownloadingMarkdown(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/analyses/${analysisId}/export/markdown`);

      if (!response.ok) {
        throw new Error('Failed to generate markdown');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${analysisName}-analysis.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccessMessage('Markdown downloaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Failed to download markdown. Please try again.');
    } finally {
      setIsDownloadingMarkdown(false);
    }
  };

  const downloadPDF = async () => {
    setIsDownloadingPDF(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/analyses/${analysisId}/export/pdf`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${analysisName}-analysis.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccessMessage('PDF downloaded successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Failed to download PDF. Please try again.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Export Your Analysis</h2>
        <p className="text-gray-600">Download comprehensive reports in multiple formats</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-red-800">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-700 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Markdown Export Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-bold text-gray-900">Markdown Export</h3>
              <p className="text-sm text-gray-500">~50-100 KB</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Plain text format, perfect for documentation and editing
          </p>

          <ul className="space-y-2 mb-6">
            <li className="flex items-start text-sm text-gray-700">
              <span className="text-green-600 mr-2">✓</span>
              Easy to edit in any text editor
            </li>
            <li className="flex items-start text-sm text-gray-700">
              <span className="text-green-600 mr-2">✓</span>
              Version control friendly
            </li>
            <li className="flex items-start text-sm text-gray-700">
              <span className="text-green-600 mr-2">✓</span>
              Fast generation
            </li>
          </ul>

          <button
            onClick={downloadMarkdown}
            disabled={isDownloadingMarkdown}
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center"
          >
            {isDownloadingMarkdown ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Download Markdown
              </>
            )}
          </button>
        </div>

        {/* PDF Export Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="bg-red-100 p-3 rounded-lg">
              <FileText className="w-8 h-8 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-bold text-gray-900">PDF Report</h3>
              <p className="text-sm text-gray-500">~200-500 KB</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Professional formatted report with comprehensive analysis
          </p>

          <ul className="space-y-2 mb-6">
            <li className="flex items-start text-sm text-gray-700">
              <span className="text-green-600 mr-2">✓</span>
              Professional formatting
            </li>
            <li className="flex items-start text-sm text-gray-700">
              <span className="text-green-600 mr-2">✓</span>
              Complete analysis data
            </li>
            <li className="flex items-start text-sm text-gray-700">
              <span className="text-green-600 mr-2">✓</span>
              Ready to share
            </li>
          </ul>

          <button
            onClick={downloadPDF}
            disabled={isDownloadingPDF}
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center"
          >
            {isDownloadingPDF ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Generate PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Markdown exports are ideal for version control and collaboration,
          while PDF exports are perfect for presentations and sharing with stakeholders.
        </p>
      </div>
    </div>
  );
}
