'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Bot, MessageSquare } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Props for the ChatView component
 */
type ChatViewProps = {
  projectName: string | null  // The project directory name containing the session
  sessionId: string | null    // The session ID (filename without .jsonl extension)
}

/**
 * Represents a single content item within a structured message.
 * Claude messages can contain multiple content types (text, tool uses, etc.)
 */
type ContentItem = {
  type: string         // Content type: 'text', 'tool_use', 'tool_result', etc.
  text?: string        // Text content for 'text' type items
  name?: string        // Tool name for 'tool_use' type
  input?: any          // Tool input parameters for 'tool_use' type
  tool_use_id?: string // ID linking tool results to tool uses
  content?: any        // Content for 'tool_result' type
}

/**
 * Represents a message in the conversation
 */
type Message = {
  role: 'user' | 'assistant' | 'system'  // Who sent the message
  content: string | ContentItem[]         // Message content (simple string or structured)
  timestamp?: string                      // When the message was sent
}

/**
 * Custom React components for rendering markdown elements.
 * These override the default ReactMarkdown renderers to apply
 * consistent styling that works with both light and dark themes.
 */
const markdownComponents: Components = {
  p: ({children}) => <p className="my-2 text-gray-800 dark:text-gray-100">{children}</p>,
  h1: ({children}) => <h1 className="text-2xl font-bold my-3 text-gray-900 dark:text-white">{children}</h1>,
  h2: ({children}) => <h2 className="text-xl font-bold my-2 text-gray-900 dark:text-white">{children}</h2>,
  h3: ({children}) => <h3 className="text-lg font-bold my-2 text-gray-900 dark:text-white">{children}</h3>,
  ul: ({children}) => <ul className="list-disc pl-6 my-2 text-gray-800 dark:text-gray-100">{children}</ul>,
  ol: ({children}) => <ol className="list-decimal pl-6 my-2 text-gray-800 dark:text-gray-100">{children}</ol>,
  li: ({children}) => <li className="my-1">{children}</li>,
  code: ({children, className}) => {
    const isInline = !className
    if (isInline) {
      return <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-sm">{children}</code>
    }
    return (
      <code className="text-gray-800 dark:text-gray-100">{children}</code>
    )
  },
  pre: ({children}) => (
    <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded my-2 overflow-x-auto border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100">
      {children}
    </pre>
  ),
  blockquote: ({children}) => (
    <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-2 italic">
      {children}
    </blockquote>
  ),
  table: ({children}) => (
    <div className="overflow-x-auto my-2">
      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
        {children}
      </table>
    </div>
  ),
  strong: ({children}) => <strong className="font-bold">{children}</strong>,
  em: ({children}) => <em className="italic">{children}</em>,
}

/**
 * ChatView Component
 * 
 * Displays a Claude conversation session in a chat-like interface.
 * Fetches and renders messages from JSONL session files, handling
 * various content types including text, tool uses, and tool results.
 * 
 * Features:
 * - Markdown rendering with GitHub Flavored Markdown support
 * - Dark mode compatible styling
 * - Tool use/result visualization
 * - Loading states and error handling
 * 
 * @param props - Component props containing project name and session ID
 * @returns React component displaying the chat conversation
 */
export default function ChatView({ projectName, sessionId }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Fetch session data whenever project or session changes
  useEffect(() => {
    if (projectName && sessionId) {
      // Reset scroll position when loading a new session
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0
      }
      fetchSession()
    }
  }, [projectName, sessionId])

  /**
   * Fetches session data from the API and updates the messages state
   */
  const fetchSession = async () => {
    if (!projectName || !sessionId) return
    
    setLoading(true)
    try {
      const encodedProject = encodeURIComponent(projectName)
      const encodedSession = encodeURIComponent(sessionId)
      const url = `/api/sessions/${encodedProject}/${encodedSession}`
      // Fetching session: url
      
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      
      const data = await res.json()
      // Received messages: data.messages?.length || 0
      setMessages(data.messages || [])
      
      // Ensure scroll reset happens after messages are rendered
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0
        }
      }, 0)
    } catch (error) {
      // Failed to fetch session
    } finally {
      setLoading(false)
    }
  }

  /**
   * Formats message content for display.
   * Handles both simple string content and structured content arrays.
   * 
   * @param content - The message content to format
   * @returns Formatted JSX elements for rendering
   */
  const formatContent = (content: string | ContentItem[]) => {
    // Handle array content (structured messages with multiple content types)
    if (Array.isArray(content)) {
      return content.map((item, idx) => {
        if (item.type === 'text' && item.text) {
          return (
            <ReactMarkdown 
              key={idx}
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {item.text}
            </ReactMarkdown>
          )
        } else if (item.type === 'tool_use') {
          // Render tool invocations with their parameters
          return (
            <div key={idx} className="my-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <div className="font-semibold text-sm text-blue-700 dark:text-blue-300">Tool: {item.name}</div>
              <pre className="text-xs mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded overflow-x-auto whitespace-pre-wrap text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                {JSON.stringify(item.input, null, 2)}
              </pre>
            </div>
          )
        } else if (item.type === 'tool_result') {
          // Extract and format tool results, handling various content formats
          let resultContent = ''
          if (typeof item.content === 'string') {
            resultContent = item.content
          } else if (Array.isArray(item.content) && item.content[0]?.type === 'text') {
            resultContent = item.content[0].text
          } else {
            resultContent = JSON.stringify(item.content, null, 2)
          }
          
          return (
            <div key={idx} className="my-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
              <div className="font-semibold text-sm text-green-700 dark:text-green-300">Tool Result</div>
              <pre className="text-xs mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded overflow-x-auto whitespace-pre-wrap text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                {resultContent}
              </pre>
            </div>
          )
        }
        return null
      })
    }
    
    // Handle simple string content with markdown rendering
    return (
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    )
  }

  // Show placeholder when no session is selected
  if (!projectName || !sessionId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>Select a conversation to view</p>
        </div>
      </div>
    )
  }

  // Show loading spinner while fetching session data
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex gap-4 p-4 rounded-lg ${
              message.role === 'assistant' 
                ? 'bg-gray-50 dark:bg-gray-800/50' 
                : message.role === 'user'
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : 'bg-yellow-50 dark:bg-yellow-900/20'
            }`}
          >
            <div className="flex-shrink-0">
              {/* Role-specific avatar icons */}
              {message.role === 'user' ? (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              ) : message.role === 'assistant' ? (
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">SYS</span>
                </div>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="font-semibold mb-1 capitalize text-gray-700 dark:text-gray-200">
                {message.role}
              </div>
              <div>
                {formatContent(message.content)}
              </div>
              {/* Display message timestamp if available */}
              {message.timestamp && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {new Date(message.timestamp).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}