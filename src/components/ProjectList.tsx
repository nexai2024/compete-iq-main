'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type ProjectItem = { id: string; name?: string; updatedAt: string };

export const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/projects');
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted) return;
        setProjects(json.projects || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    })();
    return () => { mounted = false };
  }, []);

  if (!projects.length) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-3">Saved Projects</h3>
      <ul className="space-y-2">
        {projects.map((p) => (
          <li key={p.id} className="flex justify-between items-center">
            <Link href={`/new-analysis?projectId=${p.id}`} className="text-blue-600 hover:underline">
              {p.name || 'Untitled'}
            </Link>
            <span className="text-sm text-gray-500">{new Date(p.updatedAt).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
