# Custom Console

> A sleek, feature-rich in-browser console viewer with advanced object inspection and JavaScript execution capabilities.

[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)](https://github.com/ruriazz/custom-console/releases/tag/1.0.0)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

## ✨ Features

- **🎨 Beautiful UI**: Modern, gradient-themed interface with smooth animations
- **📱 Responsive Design**: Works seamlessly on both desktop and mobile devices
- **🔍 Advanced Filtering**: Filter logs by type (log, warn, error, info, debug, result)
- **🔎 Real-time Search**: Instantly search through your console logs
- **💻 Interactive REPL**: Execute JavaScript code directly in the console viewer
- **🌳 Smart Object Formatting**: Expandable/collapsible JSON view with syntax highlighting
- **♻️ Circular Reference Handling**: Safely displays objects with circular references
- **🎯 Special Type Support**: Handles Maps, Sets, Dates, RegExp, Errors, DOM Elements, and more
- **📜 Command History**: Navigate through previous commands with arrow keys
- **⚡ Auto-resizing Input**: Command input automatically adjusts to content size
- **🔗 Function Execution**: Click on object methods to execute them inline

## 📦 Installation

### Using with Tampermonkey

Create a new userscript with the following template:

```js
// ==UserScript==
// @name         Custom Console
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Enhanced console log viewer for any website
// @author       me@ruriazz.com
// @match        *://*/*
// @require      https://cdn.jsdelivr.net/gh/ruriazz/custom-console@1.0.0/dist/custom-console.min.js
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const style = document.createElement('link');
  style.rel = 'stylesheet';
  style.href = 'https://cdn.jsdelivr.net/gh/ruriazz/custom-console@1.0.0/dist/custom-console.min.css';

  style.onload = window.CustomConsole;

  document.head.appendChild(style);
})();
```


### Direct Browser Usage

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ruriazz/custom-console@1.0.0/dist/custom-console.min.css">
</head>
<body>
    <script src="https://cdn.jsdelivr.net/gh/ruriazz/custom-console@1.0.0/dist/custom-console.min.js"></script>
    <script>
        window.CustomConsole();
    </script>
</body>
</html>
```

## 🚀 Usage

Once initialized, Custom Console automatically intercepts all console methods (`log`, `warn`, `error`, `info`, `debug`) and displays them in the viewer.

### Opening the Console

Click the **`>_`** button in the top-right corner of your screen to toggle the console panel.

### Basic Logging

```javascript
console.log('Hello, World!');
console.warn('This is a warning');
console.error('This is an error');
console.info('Some information');
console.debug('Debug message');
```

### Logging Objects

The console viewer provides beautiful formatting for complex objects:

```javascript
// Simple objects
console.log({ name: 'John', age: 30, city: 'New York' });

// Nested objects
console.log({
    user: {
        profile: {
            name: 'Jane',
            settings: { theme: 'dark', notifications: true }
        }
    }
});

// Arrays
console.log([1, 2, 3, { nested: 'value' }]);

// Maps and Sets
const myMap = new Map([['key1', 'value1'], ['key2', 'value2']]);
console.log(myMap);

const mySet = new Set([1, 2, 3, 4, 5]);
console.log(mySet);

// Dates
console.log(new Date());

// Regular Expressions
console.log(/pattern/gi);

// Errors
console.log(new Error('Something went wrong'));

// DOM Elements
console.log(document.body);
```

### Executing JavaScript

The console viewer includes a powerful REPL (Read-Eval-Print Loop) at the bottom:

1. **Type your code** in the input area
2. **Press `Cmd/Ctrl + Enter`** to execute
3. **Use `Shift + Enter`** for multi-line code
4. **Navigate history** with `↑` and `↓` arrow keys

```javascript
// Example commands
const data = { x: 10, y: 20 };
console.log(data);

// Execute calculations
Math.random() * 100

// Manipulate the DOM
document.title = 'New Title'

// Access the page's context
window.location.href
```

### Filtering Logs

Click on the colored filter buttons in the toolbar to show/hide specific log types:

- 🟢 **Log** - Standard console.log messages
- 🟠 **Warn** - Warning messages
- 🔴 **Error** - Error messages
- 🔵 **Info** - Information messages
- 🟣 **Debug** - Debug messages
- 🔵 **Result** - REPL execution results

### Searching Logs

Use the search bar to filter logs by content. The search is case-insensitive and updates in real-time.

### Clearing Logs

Click the **🗑️ Clear** button to remove all log entries.

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + Enter` | Execute JavaScript code |
| `Shift + Enter` | New line in code editor |
| `↑` Arrow Up | Previous command in history |
| `↓` Arrow Down | Next command in history |

## 🎨 UI Components

### Toggle Button
- Fixed position in the top-right corner
- Gradient purple background
- Smooth hover animations
- Always visible for quick access

### Console Panel
- **Desktop**: Bottom-right corner (600x500px)
- **Mobile**: Centered (95vw x 80vh)
- Dark theme optimized for long coding sessions
- Smooth transitions and animations

### Toolbar
- Clear button for resetting logs
- Search input for filtering
- Six filter buttons for different log types

### Log Viewer
- Auto-scrolling to latest logs
- Syntax-highlighted JSON
- Expandable/collapsible objects
- Color-coded by log type
- Max 500 logs (older logs auto-removed)

### REPL Editor
- Auto-resizing textarea
- Syntax highlighting for results
- Command history (up to 50 commands)
- Collapsible for more viewing space
- Max height: 70% of panel height

## 🛠️ Advanced Features

### Circular Reference Detection

Custom Console safely handles objects with circular references:

```javascript
const obj = { name: 'test' };
obj.self = obj;
console.log(obj); // Displays "[Circular Reference]" for the circular part
```

### Function Inspection

Methods in objects are displayed as clickable links. Click them to execute:

```javascript
const myObject = {
    greet: function() {
        return 'Hello!';
    }
};
console.log(myObject);
// Click on "[Function: greet]" to execute it
```

### Special Object Handling

- **DOM Elements**: Shows tag name, ID, and classes
- **Native Objects**: Safely extracts accessible properties
- **TypedArrays/ArrayBuffers**: Shows type and length
- **Promises**: Displays as "Promise {<pending>}"
- **Symbols**: Converted to string representation
- **BigInt**: Displayed with 'n' suffix

## 🎯 Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera
- ⚠️ IE11 (limited support)

## 📝 Configuration

Currently, Custom Console works out of the box with sensible defaults. Future versions may include configuration options for:

- Theme customization
- Panel size and position
- Max log limit
- Filter defaults
- Keyboard shortcuts

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

ISC License - feel free to use this in your projects!

## 👤 Author

**ruriazz**
- Email: me@ruriazz.com
- GitHub: [@ruriazz](https://github.com/ruriazz)

## 🙏 Acknowledgments

Built with:
- [Rollup](https://rollupjs.org/) - Module bundler
- [PostCSS](https://postcss.org/) - CSS processor
- Modern ES6+ JavaScript

---

**Enjoy debugging with style!** ✨