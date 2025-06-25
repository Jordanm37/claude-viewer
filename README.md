# Claude Viewer

A modern web application for browsing and viewing Claude conversation session transcripts stored in the `.claude/projects` directory.

## Features

- 📁 **File Tree Navigation**: Browse your Claude sessions organized by project directories
- 💬 **Chat-Style Interface**: View conversations in a familiar chat format
- 🌗 **Dark Mode Support**: Toggle between light and dark themes
- 🔍 **Auto-Expand Navigation**: Direct links to sessions automatically expand the file tree
- 📋 **Copy Session Paths**: Quickly copy JSONL file paths to clipboard
- 📝 **Markdown Rendering**: Full markdown support with syntax highlighting
- 🛠️ **Tool Visualization**: See tool calls and results in formatted blocks

## Prerequisites

- Node.js 18.x or higher
- Yarn package manager
- Claude Code or Claude Desktop with session files in `~/.claude/projects/`

## Installation

1. Clone the repository:
```bash
git clone https://github.com/phpmypython/claude-viewer.git
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

### Running Tests
```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with UI
yarn test:ui
```

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
  Sidebar.tsx           # File tree navigation
  ChatView.tsx          # Conversation display
/tests                  # Playwright E2E tests
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
- [Playwright](https://playwright.dev/) for testing