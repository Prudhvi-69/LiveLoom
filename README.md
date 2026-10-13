# LiveLoom

A compact, offline-first HTML, CSS, and JavaScript workspace with local project management and a live preview.

## Features

### Core Features
- **Split View Layout**: Resizable editor and live preview workspace
- **Three Code Editors**: HTML, CSS, and JavaScript with editor-friendly indentation
- **Live Preview**: Real-time rendering using browser's native HTML parser, CSS engine, and JS engine
- **Auto-Closing HTML Tags**: Typing `>` finishes an opening tag and inserts its matching closing tag, leaving the cursor between the two
- **Error Handling**: JavaScript errors are caught and displayed in the preview

### Project Management (LocalStorage)
- **Create Multiple Projects**: Create HTML/CSS/JS projects in the browser
- **Auto-Save**: Updates existing saved projects three seconds after changes
- **Manual Save**: Save projects with custom names (Ctrl/Cmd + S)
- **Load Projects**: Switch between saved projects from the sidebar
- **Delete Projects**: Remove individual projects or clear all at once
- **Persistent Storage**: All projects stored in browser's LocalStorage
- **Last Project Memory**: Automatically loads your last opened project

### User Interface
- **Four Appearances**: Choose Light, Dark, Eco, or Neon from the toolbar; your choice is remembered separately from your projects
- **Theme Palettes**: Warm Light, monochrome Dark, natural-green Eco, and lime-accent Neon
- **Project Sidebar**: Collapsible project switcher with touch-friendly controls
- **Save State**: Clear local, edited, and unsaved status feedback
- **Notifications**: Quiet toasts for save, delete, and export actions
- **Mobile Workspace**: Switch between the stacked editors and preview on narrow screens
- **Modal Dialogs**: Confirmation dialogs for destructive actions

### 📤 Export & Import
- **Export to HTML**: Download complete standalone HTML file with embedded CSS and JS
- **Project Naming**: Custom project names for organization
- **Timestamp Tracking**: Created and last modified dates for each project

### ⌨️ Keyboard Shortcuts
- **Ctrl/Cmd + S**: Save current project
- **Ctrl/Cmd + N**: Create new project
- **Ctrl/Cmd + E**: Export project as HTML file
- **Tab**: Insert 4 spaces in code editors

### 🔧 Developer Features
- **Tab Support**: Proper tab indentation in all editors
- **Code Preservation**: Warns before losing unsaved changes
- **Refresh Preview**: Manual refresh button for preview
- **Responsive Design**: Adapts to different screen sizes

## 🎮 How to Use

### Getting Started
1. Open `index.html` in your web browser
2. Start coding in the HTML, CSS, or JavaScript editors
3. See live preview on the right side instantly

### Creating Projects
1. Write your code in the editors
2. Enter a project name in the input field (top toolbar)
3. Click **Save project** or press Ctrl/Cmd + S
4. Your project is now saved to LocalStorage!

### Managing Projects
1. Click **Projects** to open the sidebar
2. Click any project to load it
3. Click **Delete** on a project to remove it
4. Click **Clear all** to delete every saved project (with confirmation)

### Exporting Projects
1. Click **Export HTML** or press Ctrl/Cmd + E
2. A complete HTML file will be downloaded
3. The file includes all HTML, CSS, and JS embedded

### Creating New Projects
1. Click **New** or press Ctrl/Cmd + N
2. If you have unsaved changes, you'll be prompted to save
3. Editors will be cleared for a fresh start

## 🏗️ Technical Details

### LocalStorage Structure
```javascript
// Projects are stored as:
{
  id: "unique-id",
  name: "Project Name",
  html: "HTML code",
  css: "CSS code",
  js: "JavaScript code",
  created: "ISO timestamp",
  lastModified: "ISO timestamp"
}
```

### File Synchronization
- All code changes are tracked in real-time
- The save status and editor labels show unsaved changes
- Auto-save triggers 3 seconds after last edit
- Preview updates instantly on every keystroke

### Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Edge, Safari)
- Requires LocalStorage support
- Uses iframe for isolated preview rendering

## Appearance Themes
Choose Light, Dark, Eco, or Neon from the Appearance selector in the toolbar. The mode is remembered in a separate browser preference (`liveloom_appearance`); changing it does not modify project code or save state. The live preview remains white in every mode so rendered pages are unaffected by the workspace theme.

## 📁 Project Structure
```
LiveLoom/
├── index.html      # Main HTML structure and theme bootstrap
├── style.css       # Four tokenized appearances and workspace layout
├── favicon.svg     # Crimson LL browser-tab mark
├── Loom Logo.jpg   # Toolbar brand artwork
├── script.js       # Editor, project, and appearance logic
├── autoclose.js    # Auto-closing HTML tags in the HTML editor
└── README.md       # This file
```

## 🚀 Advanced Features

### Auto-Save System
- Monitors all editor changes
- Debounced save (3 seconds after last edit)
- Only saves if project already exists
- Visual feedback via file indicators

### Project Persistence
- Stores unlimited projects in LocalStorage
- Remembers last opened project
- Survives browser restarts
- No server required - 100% offline

### Live Preview Engine
- Uses iframe for isolation
- Injects HTML, CSS, and JS dynamically
- Catches and displays JavaScript errors
- Updates in real-time without page reload

### HTML Tag Auto-Closing (`autoclose.js`)
- Type `>` at the end of an unfinished opening tag and the closing tag appears: `<div class="box">` + `>` → `<div class="box">|</div>`
- The cursor lands between the two tags, so the element's content can be typed immediately
- Tags nested inside an auto-closed element are closed too: `<div><p>` → `<div><p>|</p></div>`
- Void elements (`<br>`, `<img>`, `<input>`…), self-closing syntax (`<br/>`), comments, doctypes and `</closing>` tags are left untouched
- Typing `>` over a tag that already has one steps the cursor past it instead of duplicating it
- Used only in the HTML editor — CSS and JavaScript are never rewritten

### Safety Features
- Warns before losing unsaved changes
- Confirmation dialogs for deletions
- Auto-save prevents data loss
- Export creates backup files

## 💡 Tips & Tricks

1. **Quick Save**: Use Ctrl/Cmd + S frequently to save your work
2. **Project Organization**: Use descriptive names for easy identification
3. **Export Backups**: Regularly export important projects as HTML files
4. **Tab Indentation**: Use Tab key for proper code indentation
5. **Error Checking**: Watch the preview for JavaScript error messages
6. **Multiple Projects**: Create separate projects for different experiments

## 🔮 Future Enhancements (Ideas)
- Multiple file support per project (multiple HTML/CSS/JS files)
- Code syntax highlighting with libraries like Prism.js
- Code formatting with Prettier
- Import external libraries (CDN links)
- Syntax highlighting for the code editors
- Code snippets library
- Collaboration features
- Version history

## 📝 Notes

- All data is stored locally in your browser
- Clearing browser data will delete all projects
- Export important projects to keep backups
- LocalStorage has ~5-10MB limit (varies by browser)
- Each project's code is stored as plain text

## 🎉 Enjoy Coding!

LiveLoom lets you create, save, and manage web projects entirely offline in your browser.
