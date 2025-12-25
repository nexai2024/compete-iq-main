import Link from 'next/link';
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { BarChart, Target, Users, FileText } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <BarChart className="w-8 h-8 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">CompeteIQ</h1>
          </div>
          <div className="flex items-center space-x-4">
            <SignedIn>
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Dashboard
              </Link>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-gray-700 hover:text-gray-900 transition">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Validate Your App Idea with AI
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Get AI-powered competitive analysis, feature comparisons, and strategic insights
            to position your app for success in the market
          </p>
          <SignedOut>
            <SignUpButton mode="modal">
              <button className="px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition shadow-lg">
                Start Free Analysis
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/new-analysis"
              className="inline-block px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition shadow-lg"
            >
              Create New Analysis
            </Link>
          </SignedIn>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <Target className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Competitor Analysis</h3>
            <p className="text-gray-600 text-sm">
              AI identifies your top competitors and analyzes their features and positioning
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <BarChart className="w-12 h-12 text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Feature Matrix</h3>
            <p className="text-gray-600 text-sm">
              Compare your features against competitors across key parameters
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <Users className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Persona Testing</h3>
            <p className="text-gray-600 text-sm">
              Chat with AI personas to get feedback from different user perspectives
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <FileText className="w-12 h-12 text-orange-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Export Reports</h3>
            <p className="text-gray-600 text-sm">
              Download comprehensive reports as PDF or Markdown for your team
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 bg-white rounded-lg shadow-xl p-12 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to analyze your app idea?
          </h3>
          <p className="text-gray-600 mb-8">
            Get strategic insights in minutes with AI-powered market analysis
          </p>
          <SignedOut>
            <SignUpButton mode="modal">
              <button className="px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition">
                Get Started Free
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/new-analysis"
              className="inline-block px-8 py-4 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700 transition"
            >
              Create Analysis
            </Link>
          </SignedIn>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white mt-20 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p>&copy; 2024 CompeteIQ. AI-powered market analysis for founders.</p>
        </div>
      </footer>
    </div>
  );
}
