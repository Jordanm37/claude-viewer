# Claude Viewer

A modern web application for browsing and viewing Claude conversation session transcripts stored in the `.claude/projects` directory.

## Features

- 📁 **File Tree Navigation**: Browse your Claude sessions organized by project directories
- 💬 **Chat-Style Interface**: View conversations in a familiar chat format  
- 🌗 **Dark Mode Support**: Toggle between light and dark themes
- 🔍 **Search & Filter**: Search through all your sessions with fuzzy matching
- ⭐ **Bookmarking**: Star your favorite sessions for quick access
- 🔄 **Live Updates**: Automatically refreshes when Claude is actively running
- 📋 **Copy Functionality**: Copy session IDs and tool outputs with visual feedback
- 📝 **Markdown Rendering**: Full markdown support with syntax highlighting
- 🛠️ **Tool Visualization**: Specialized renderers for different tool types (bash, file operations, etc.)
- 📱 **Responsive Design**: Works seamlessly on mobile and desktop
- ⌨️ **Keyboard Navigation**: Navigate sessions with arrow keys
- 📤 **Export to Markdown**: Export entire conversations as markdown files

## Prerequisites

- Node.js 18.x or higher
- Yarn package manager
- Claude Code or Claude Desktop with session files in `~/.claude/projects/`

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd claude-viewer
```

2. Install dependencies:
```bash
yarn install
```

3. Run the development server:
```bash
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Session File Location

By default, the application looks for Claude session files in:
```
~/.claude/projects/
```

This is the standard location where Claude Code and Claude Desktop store conversation transcripts in JSONL format.

## Usage

### Browsing Sessions
- Click on folders in the sidebar to expand/collapse them
- Click on a session to view the conversation
- Use the theme toggle button to switch between light and dark mode

### Direct Links
You can link directly to a specific session using URL parameters:
```
http://localhost:3000/?session=<session-id>
```

The application will automatically expand the file tree to show the selected session.

### Copying File Paths
When viewing a session, hover over it in the sidebar and click the copy icon to copy the full JSONL file path to your clipboard.

## Development


### Building for Production
```bash
yarn build
yarn start
```

### Project Structure
```
/app                    # Next.js app directory
  /api                  # API routes for reading sessions
  page.tsx              # Main page component
/components             # React components
  /session              # Session-related components
  /tool-renderers       # Tool call visualization components
  /ui                   # UI components (buttons, cards, etc.)
/lib                    # Utility libraries and types
/hooks                  # Custom React hooks
```

## Configuration

The application uses sensible defaults and doesn't require configuration for most users. If your Claude sessions are stored in a different location, you'll need to modify the API routes to point to the correct directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [react-markdown](https://github.com/remarkjs/react-markdown)
- [Radix UI](https://radix-ui.com/) for components