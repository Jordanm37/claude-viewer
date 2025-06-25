'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import ChatView from '@/components/ChatView'

export type Session = {
  id: string
  filename: string
  modified: string
  size: number
  title: string
}

export type Project = {
  name: string
  displayName: string
  sessions: Session[]
}

export type FileTreeNode = {
  name: string
  path: string
  type: 'folder' | 'project'
  children: FileTreeNode[]
  project?: Project
  sessionCount?: number
}

export type GroupedProjects = Record<string, Project[]>

export default function Home() {
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([])
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionIdFromUrl = searchParams.get('session')

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    // Handle direct session links
    if (sessionIdFromUrl && !loading) {
      findAndSelectSession(sessionIdFromUrl)
    }
  }, [sessionIdFromUrl, loading])

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/sessions')
      const data = await res.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setFileTree(data.fileTree || [])
      }
      setLoading(false)
    } catch (error) {
      setError('Failed to connect to the server. Please ensure the development server is running.')
      setLoading(false)
    }
  }

  const findAndSelectSession = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/find/${sessionId}`)
      const data = await res.json()
      
      if (data.found) {
        setSelectedProject(data.projectName)
        setSelectedSession(data.sessionId)
      }
    } catch (error) {
      console.error('Failed to find session:', error)
    }
  }

  const handleSessionSelect = (projectName: string, sessionId: string) => {
    setSelectedProject(projectName)
    setSelectedSession(sessionId)
    
    // Update URL
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('session', sessionId)
    router.push(newUrl.pathname + newUrl.search)
  }

  // Show error state if there's an error
  if (error && !loading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4">📁</div>
          <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">No Sessions Found</h2>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <button 
            onClick={() => {
              setError(null)
              setLoading(true)
              fetchProjects()
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar 
        fileTree={fileTree}
        selectedProject={selectedProject}
        selectedSession={selectedSession}
        onSelectSession={handleSessionSelect}
        loading={loading}
      />
      <ChatView 
        projectName={selectedProject}
        sessionId={selectedSession}
      />
    </div>
  )
}