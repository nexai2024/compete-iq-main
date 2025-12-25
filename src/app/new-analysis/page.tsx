import { AnalysisForm } from '@/components/AnalysisForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NewAnalysisPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">Create New Analysis</h1>
          <p className="mt-2 text-lg text-gray-600">
            Tell us about your app idea and we'll analyze it against the market
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <AnalysisForm />
        </div>
      </div>
    </div>
  );
}
