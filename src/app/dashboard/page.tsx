import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ProjectList } from '@/components/ProjectList';

export default function DashboardPage() {
  return (    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Analyses</h1>
            <p className="text-gray-600 mt-2">Manage and review your market analyses</p>
          </div>
          <Link
            href="/new-analysis"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Analysis
          </Link>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No analyses yet
            </h2>
            <p className="text-gray-600 mb-6">
              Create your first market analysis to get AI-powered insights about your app idea
            </p>
            <Link
              href="/new-analysis"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Analysis
            </Link>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Quick Analysis</h3>
            <p className="text-sm text-gray-600">
              Get comprehensive market insights in 2-3 minutes
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">AI-Powered</h3>
            <p className="text-sm text-gray-600">
              Uses GPT-4 and Perplexity for accurate competitor research
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-2">Export Ready</h3>
            <p className="text-sm text-gray-600">
              Download reports as PDF or Markdown for your team
            </p>
          </div>
        </div>

        {/* Saved Projects */}
        <div className="mt-8">
          <ProjectList />
        </div>
      </div>
    </div>
  );
}
