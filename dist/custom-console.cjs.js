'use strict';

// Initialize console interception early and create global buffer
if (!window.__customConsoleBuffer) {
    window.__customConsoleBuffer = [];
    
    // Store original console methods
    window.__originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        info: console.info,
        debug: console.debug
    };
    
    // Intercept console methods immediately
    const interceptConsole = (type, originalMethod) => {
        console[type] = function(...args) {
            // Call original method first
            originalMethod.apply(console, args);
            
            // Add to buffer
            window.__customConsoleBuffer.push({
                type,
                args: args.map(arg => {
                    // Handle objects that might lose reference
                    if (typeof arg === 'object' && arg !== null) {
                        try {
                            return JSON.parse(JSON.stringify(arg));
                        } catch (e) {
                            return String(arg);
                        }
                    }
                    return arg;
                }),
                timestamp: Date.now(),
                time: new Date()
            });
            
            // Limit buffer size
            if (window.__customConsoleBuffer.length > 1000) {
                window.__customConsoleBuffer.shift();
            }
        };
    };
    
    interceptConsole('log', window.__originalConsole.log);
    interceptConsole('warn', window.__originalConsole.warn);
    interceptConsole('error', window.__originalConsole.error);
    interceptConsole('info', window.__originalConsole.info);
    interceptConsole('debug', window.__originalConsole.debug);
}

window.CustomConsole = () => {
    const originalLog = window.__originalConsole.log;
    const originalWarn = window.__originalConsole.warn;
    const originalError = window.__originalConsole.error;
    const originalInfo = window.__originalConsole.info;
    const originalDebug = window.__originalConsole.debug;

    let logs = [];
    let isVisible = false;
    let activeFilters = new Set(['log', 'warn', 'error', 'info', 'debug', 'result']);
    let searchQuery = '';
    let commandHistory = [];
    let historyIndex = -1;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'console-viewer-toggle';
    toggleBtn.innerHTML = '>_';
    toggleBtn.title = 'Toggle Console Viewer';
    document.body.appendChild(toggleBtn);

    const panel = document.createElement('div');
    panel.className = 'console-viewer-panel hidden';
    panel.innerHTML = `
        <div class="console-viewer-toolbar">
            <button class="console-viewer-clear">🗑️ Clear</button>
            <div class="console-viewer-search">
                <input type="text" placeholder="🔍 Search logs...">
            </div>
            <button class="console-viewer-filter log active" data-type="log">
                <span class="filter-dot"></span>
            </button>
            <button class="console-viewer-filter warn active" data-type="warn">
                <span class="filter-dot"></span>
            </button>
            <button class="console-viewer-filter error active" data-type="error">
                <span class="filter-dot"></span>
            </button>
            <button class="console-viewer-filter info active" data-type="info">
                <span class="filter-dot"></span>
            </button>
            <button class="console-viewer-filter debug active" data-type="debug">
                <span class="filter-dot"></span>
            </button>
            <button class="console-viewer-filter result active" data-type="result">
                <span class="filter-dot"></span>
            </button>
        </div>
        <div class="console-viewer-logs"></div>
        <div class="console-viewer-prompt">
            <div class="console-viewer-prompt-header">
                <button class="console-viewer-prompt-toggle">↕ Toggle</button>
                <div class="console-viewer-prompt-controls">
                    <button class="console-viewer-run">▶ Run</button>
                </div>
            </div>
            <textarea placeholder="› Execute JavaScript..." rows="1"></textarea>
        </div>
    `;
    document.body.appendChild(panel);

    const logsContainer = panel.querySelector('.console-viewer-logs');
    const clearBtn = panel.querySelector('.console-viewer-clear');
    const searchInput = panel.querySelector('.console-viewer-search input');
    const filterBtns = panel.querySelectorAll('.console-viewer-filter');
    const promptInput = panel.querySelector('.console-viewer-prompt textarea');
    const runBtn = panel.querySelector('.console-viewer-run');
    const promptToggle = panel.querySelector('.console-viewer-prompt-toggle');
    const promptContainer = panel.querySelector('.console-viewer-prompt');

    toggleBtn.addEventListener('click', () => {
        isVisible = !isVisible;
        panel.classList.toggle('hidden', !isVisible);
        if (isVisible) {
            // Auto resize when panel is opened
            setTimeout(autoResizeTextarea, 100);
        }
    });

    clearBtn.addEventListener('click', () => {
        logs = [];
        renderLogs();
    });

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderLogs();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const { type } = btn.dataset;
            if (activeFilters.has(type)) {
                activeFilters.delete(type);
                btn.classList.remove('active');
            } else {
                activeFilters.add(type);
                btn.classList.add('active');
            }
            renderLogs();
        });
    });

    function executeJS(code) {
        if (!code.trim()) return;

        commandHistory.unshift(code);
        if (commandHistory.length > 50) commandHistory.pop();
        historyIndex = -1;

        logs.push({
            type: 'info',
            message: `› ${code}`,
            time: new Date()
        });

        try {
            const result = eval(code);
            logs.push({
                type: 'result',
                message: result !== undefined ? String(result) : 'undefined',
                time: new Date()
            });
        } catch (error) {
            logs.push({
                type: 'error',
                message: `Error: ${error.message}`,
                time: new Date()
            });
        }

        renderLogs();
    }

    runBtn.addEventListener('click', () => {
        executeJS(promptInput.value);
        promptInput.value = '';
        promptInput.style.height = 'auto';
        autoResizeTextarea();
    });

    promptInput.addEventListener('keydown', (e) => {
        // Prevent context menu on Cmd/Ctrl + A and other keyboard shortcuts
        if ((e.metaKey || e.ctrlKey) && (e.key === 'a' || e.key === 'c' || e.key === 'v' || e.key === 'x')) {
            e.stopPropagation();
        }

        // Cmd/Ctrl + Enter to execute code
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            executeJS(promptInput.value);
            promptInput.value = '';
            promptInput.style.height = 'auto';
            autoResizeTextarea();
            return;
        }

        // Shift+Enter for new line (default behavior)
        // Arrow up/down for history navigation only when not multiline or at edges
        if (e.key === 'ArrowUp' && !e.shiftKey) {
            const cursorAtStart = promptInput.selectionStart === 0;
            if (cursorAtStart && historyIndex < commandHistory.length - 1) {
                e.preventDefault();
                historyIndex++;
                promptInput.value = commandHistory[historyIndex];
                autoResizeTextarea();
            }
        } else if (e.key === 'ArrowDown' && !e.shiftKey) {
            const cursorAtEnd = promptInput.selectionStart === promptInput.value.length;
            if (cursorAtEnd) {
                e.preventDefault();
                if (historyIndex > 0) {
                    historyIndex--;
                    promptInput.value = commandHistory[historyIndex];
                } else if (historyIndex === 0) {
                    historyIndex = -1;
                    promptInput.value = '';
                }
                autoResizeTextarea();
            }
        }
    });

    // Prevent context menu from appearing on keyboard shortcuts
    promptInput.addEventListener('contextmenu', (e) => {
        // Only prevent if it's triggered by keyboard (no mouse position)
        if (e.clientX === 0 && e.clientY === 0) {
            e.preventDefault();
        }
    });

    let isPromptCollapsed = false;
    let promptInitialHeight = 32;

    function autoResizeTextarea() {
        if (!panel.offsetHeight) return; // Panel not visible yet

        const panelHeight = panel.offsetHeight;
        const maxHeight = Math.floor(panelHeight * 0.7); // 70% of panel height
        const minHeight = 32;
        const threshold20Percent = Math.floor(panelHeight * 0.2); // 20% threshold

        // Reset height to calculate scroll height
        promptInput.style.height = 'auto';

        // Calculate new height
        let newHeight = Math.max(minHeight, promptInput.scrollHeight);

        // Limit to max height
        if (newHeight > maxHeight) {
            newHeight = maxHeight;
            promptInput.style.overflowY = 'auto';
        } else {
            promptInput.style.overflowY = 'hidden';
        }

        promptInput.style.height = newHeight + 'px';

        // Update max-height dynamically
        promptInput.style.maxHeight = maxHeight + 'px';

        // Show/hide toggle button based on height
        if (newHeight > threshold20Percent && !isPromptCollapsed) {
            promptToggle.classList.add('visible');
            promptToggle.textContent = '↓ Collapse';
        } else if (isPromptCollapsed) {
            promptToggle.classList.add('visible');
            promptToggle.textContent = '↑ Expand';
        } else {
            promptToggle.classList.remove('visible');
        }
    }

    promptInput.addEventListener('input', autoResizeTextarea);

    // Also resize on window resize
    window.addEventListener('resize', autoResizeTextarea);

    // Utility function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    promptToggle.addEventListener('click', () => {
        isPromptCollapsed = !isPromptCollapsed;

        if (isPromptCollapsed) {
            promptContainer.classList.add('collapsed');
            promptToggle.textContent = '↑ Expand';
            promptInput.style.height = promptInitialHeight + 'px';
        } else {
            promptContainer.classList.remove('collapsed');
            promptToggle.textContent = '↓ Collapse';
            autoResizeTextarea();
        }
    });

    function addLog(type, args, timestamp = null) {
        const processedArgs = args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                return formatObject(arg);
            }
            return String(arg);
        });

        logs.push({
            type,
            message: processedArgs.join(' '),
            time: timestamp ? new Date(timestamp) : new Date()
        });

        if (logs.length > 500) {
            logs.shift();
        }

        renderLogs();
    }

    function formatObject(obj, visited = new WeakSet()) {
        // Handle null dan undefined
        if (obj === null) return '<span class="json-null">null</span>';
        if (obj === undefined) return '<span class="json-null">undefined</span>';

        // Handle primitives
        const type = typeof obj;
        if (type === 'string') return `<span class="json-string">"${escapeHtml(obj)}"</span>`;
        if (type === 'number') return `<span class="json-number">${obj}</span>`;
        if (type === 'boolean') return `<span class="json-boolean">${obj}</span>`;
        if (type === 'symbol') return `<span class="json-null">${obj.toString()}</span>`;
        if (type === 'bigint') return `<span class="json-number">${obj}n</span>`;

        // Handle functions
        if (type === 'function') {
            const funcStr = obj.toString();
            const preview = funcStr.length > 50 ? funcStr.substring(0, 50) + '...' : funcStr;
            return `<span class="json-null">ƒ ${obj.name || 'anonymous'}() { ${escapeHtml(preview)} }</span>`;
        }

        // Check circular reference
        if (visited.has(obj)) {
            return '<span class="json-null">[Circular Reference]</span>';
        }

        try {
            // Add to visited set
            visited.add(obj);

            // Handle Date
            if (obj instanceof Date) {
                return `<span class="json-string">${obj.toISOString()}</span>`;
            }

            // Handle RegExp
            if (obj instanceof RegExp) {
                return `<span class="json-string">${obj.toString()}</span>`;
            }

            // Handle Error
            if (obj instanceof Error) {
                return createJsonDisplay({
                    name: obj.name,
                    message: obj.message,
                    stack: obj.stack
                }, obj.name);
            }

            // Handle Map
            if (obj instanceof Map) {
                const mapObj = {};
                let index = 0;
                obj.forEach((value, key) => {
                    mapObj[`${key} =>`] = value;
                    index++;
                });
                return createJsonDisplay(mapObj, `Map(${obj.size})`);
            }

            // Handle Set
            if (obj instanceof Set) {
                const setArray = Array.from(obj);
                return createJsonDisplay(setArray, `Set(${obj.size})`);
            }

            // Handle Array
            if (Array.isArray(obj)) {
                return createJsonDisplay(obj, `Array(${obj.length})`);
            }

            // Handle DOM Elements
            if (typeof Element !== 'undefined' && obj instanceof Element) {
                const tagName = obj.tagName ? obj.tagName.toLowerCase() : 'element';
                const id = obj.id ? `#${obj.id}` : '';
                const classes = obj.className ? `.${obj.className.replace(/\s+/g, '.')}` : '';
                return `<span class="json-null">&lt;${tagName}${id}${classes}&gt;</span>`;
            }

            // Handle other DOM nodes
            if (typeof Node !== 'undefined' && obj instanceof Node) {
                return `<span class="json-null">[${obj.constructor.name}]</span>`;
            }

            // Handle native browser objects yang tidak bisa di-serialize
            const nativeObjectTypes = [
                'Window', 'Document', 'HTMLDocument', 'Location', 'Navigator',
                'Screen', 'History', 'Storage', 'Performance', 'Console',
                'MediaDevices', 'AudioContext', 'WebGLRenderingContext',
                'CanvasRenderingContext2D', 'XMLHttpRequest', 'WebSocket'
            ];

            const constructorName = obj.constructor?.name || '';
            if (nativeObjectTypes.includes(constructorName) ||
                constructorName.includes('Element') ||
                constructorName.includes('HTML') ||
                constructorName.includes('SVG')) {

                // Extract properties yang bisa diakses
                const safeProps = extractSafeProperties(obj, visited);
                return createJsonDisplay(safeProps, constructorName);
            }

            // Handle ArrayBuffer dan TypedArrays
            if (obj instanceof ArrayBuffer || ArrayBuffer.isView(obj)) {
                const typeName = obj.constructor.name;
                const length = obj.byteLength || obj.length || 0;
                return `<span class="json-null">${typeName}(${length})</span>`;
            }

            // Handle Promise
            if (obj instanceof Promise) {
                return '<span class="json-null">Promise {&lt;pending&gt;}</span>';
            }

            // Handle plain objects
            const safeObj = extractSafeProperties(obj, visited);
            const objName = constructorName !== 'Object' ? constructorName : null;
            return createJsonDisplay(safeObj, objName);

        } catch (e) {
            // Ultimate fallback
            try {
                return `<span class="json-null">[${obj.constructor?.name || typeof obj}]</span>`;
            } catch (e2) {
                return '<span class="json-null">[Object]</span>';
            }
        }
    }

    function extractSafeProperties(obj, visited = new WeakSet()) {
        const props = {};
        const maxProps = 100;
        let count = 0;

        try {
            // Get own enumerable properties first
            for (const prop in obj) {
                if (count >= maxProps) {
                    props['...'] = `more properties`;
                    break;
                }

                try {
                    let value = obj[prop];

                    if (typeof value === 'function') {
                        value = `[Function: ${prop}]`;
                    } else if (typeof value === 'object' && value !== null && visited.has(value)) {
                        value = '[Circular]';
                    }

                    props[prop] = value;
                    count++;
                } catch (e) {
                    props[prop] = `[Error: ${e.message}]`;
                    count++;
                }
            }

            // Get own non-enumerable properties
            const ownProps = Object.getOwnPropertyNames(obj);
            for (const prop of ownProps) {
                if (props.hasOwnProperty(prop) || count >= maxProps) continue;

                try {
                    const descriptor = Object.getOwnPropertyDescriptor(obj, prop);
                    if (!descriptor) continue;

                    let value;
                    if (descriptor.get || descriptor.set) {
                        value = '[Getter/Setter]';
                    } else if (typeof descriptor.value === 'function') {
                        value = `[Function: ${prop}]`;
                    } else {
                        try {
                            value = obj[prop];
                            if (typeof value === 'object' && value !== null && visited.has(value)) {
                                value = '[Circular]';
                            }
                        } catch (e) {
                            value = `[Error accessing]`;
                        }
                    }

                    props[prop] = value;
                    count++;
                } catch (e) {
                    // Skip
                }
            }

            // Get prototype properties (methods)
            if (count < maxProps && obj.constructor && obj.constructor.name !== 'Object') {
                const proto = Object.getPrototypeOf(obj);
                if (proto && proto !== Object.prototype) {
                    const protoProps = Object.getOwnPropertyNames(proto);
                    for (const prop of protoProps) {
                        if (props.hasOwnProperty(prop) || count >= maxProps) continue;
                        if (prop === 'constructor') continue;

                        try {
                            const descriptor = Object.getOwnPropertyDescriptor(proto, prop);
                            if (!descriptor) continue;

                            if (typeof descriptor.value === 'function') {
                                props[prop] = `[Function: ${prop}]`;
                                count++;
                            } else if (descriptor.get || descriptor.set) {
                                props[prop] = '[Getter/Setter]';
                                count++;
                            }
                        } catch (e) {
                            // Skip
                        }
                    }
                }
            }

        } catch (e) {
            return { error: e.message };
        }

        return props;
    }

    function createJsonDisplay(obj, objectName = null) {
        const id = 'json_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const objId = 'obj_' + id;

        // Store object reference for function execution
        if (!window.__consoleViewerObjects) {
            window.__consoleViewerObjects = new Map();
        }
        window.__consoleViewerObjects.set(objId, obj);

        // Try to stringify with circular reference handling
        let jsonString;
        try {
            const seen = new WeakSet();
            jsonString = JSON.stringify(obj, (key, value) => {
                if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) {
                        return '[Circular]';
                    }
                    seen.add(value);

                    // Handle special types
                    if (value instanceof Date) return value.toISOString();
                    if (value instanceof RegExp) return value.toString();
                    if (value instanceof Error) return `Error: ${value.message}`;
                    if (typeof value.toString === 'function' &&
                        value.toString !== Object.prototype.toString &&
                        !Array.isArray(value)) {
                        const str = value.toString();
                        if (str !== '[object Object]') {
                            return str;
                        }
                    }
                }
                if (typeof value === 'function') {
                    return `[Function: ${value.name || 'anonymous'}]`;
                }
                if (typeof value === 'symbol') {
                    return value.toString();
                }
                if (typeof value === 'bigint') {
                    return value.toString() + 'n';
                }
                if (value === undefined) {
                    return '[undefined]';
                }
                return value;
            }, 2);
        } catch (e) {
            jsonString = `"[Error formatting object: ${e.message}]"`;
        }

        const formattedJson = syntaxHighlightJson(jsonString, objId);

        const displayName = objectName || (Array.isArray(obj) ? 'Array' : 'Object');
        const itemCount = Array.isArray(obj) ? obj.length : Object.keys(obj).length;

        return `<div class="json-container">
            <div class="json-header" onclick="toggleJson('${id}')">
                <span class="json-toggle" id="toggle_${id}">▼</span>
                <span>${displayName}(${itemCount})</span>
            </div>
            <div class="json-content" id="${id}" data-obj-id="${objId}">
                ${formattedJson}
            </div>
        </div>`;
    }

    function syntaxHighlightJson(json, objId) {
        // sourcery skip: dont-reassign-parameters
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        const lines = json.split('\n');
        const highlightedLines = lines.map(line => {
            const leadingSpaces = line.match(/^(\s*)/)[1];
            const content = line.trim();

            if (!content) return '';

            // Extract property name for function detection
            const funcMatch = content.match(/"([^"]+)":\s*"\[Function:\s*([^\]]+)\]"/);

            const highlighted = content.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            }).replace(/([{}[\],])/g, '<span class="json-bracket">$1</span>');

            // Make functions clickable
            let finalHighlighted = highlighted;
            if (funcMatch) {
                const propName = funcMatch[1];
                finalHighlighted = highlighted.replace(
                    /"\[Function:[^\]]+\]"/g,
                    `<span class="json-function" onclick="executeFunction('${objId}', '${propName}', this)" style="cursor: pointer; text-decoration: underline;">"[Function: ${propName}]"</span>`
                );
            } else {
                // Also handle getter/setter
                finalHighlighted = highlighted.replace(
                    /"\[Getter\/Setter\]"/g,
                    '<span class="json-null">"[Getter/Setter]"</span>'
                );
            }

            const indentHtml = leadingSpaces.replace(/ /g, '&nbsp;');

            return indentHtml + finalHighlighted;
        });

        return highlightedLines.join('<br>');
    }

    window.executeFunction = function (objId, propName, element) {
        try {
            const obj = window.__consoleViewerObjects.get(objId);
            if (!obj) {
                console.error('Object not found');
                return;
            }

            const func = obj[propName];
            if (typeof func !== 'function') {
                console.error('Property is not a function');
                return;
            }

            // Execute function
            const result = func.call(obj);

            // Format result
            let resultHtml;
            if (typeof result === 'object' && result !== null) {
                resultHtml = formatObject(result);
            } else {
                resultHtml = formatObject(result);
            }

            // Replace function text with result
            const line = element.parentElement;
            const keyMatch = line.innerHTML.match(/<span class="json-key">"([^"]+)"<\/span>/);
            if (keyMatch) {
                const key = keyMatch[1];
                // Create expandable result
                const resultId = 'result_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                line.innerHTML = `<span class="json-key">"${key}"</span><span class="json-bracket">:</span> ${resultHtml}`;
            }

        } catch (e) {
            console.error('Error executing function:', e);
            element.innerHTML = `<span class="json-string">"[Error: ${e.message}]"</span>`;
        }
    };

    window.toggleJson = function (id) {
        const content = document.getElementById(id);
        const toggle = document.getElementById('toggle_' + id);
        
        if (content && toggle) {
            if (content.style.display === 'none') {
                content.style.display = 'block';
                toggle.textContent = '▼';
            } else {
                content.style.display = 'none';
                toggle.textContent = '▶';
            }
        }
    };

    function renderLogs() {
        const filtered = logs.filter(log => {
            const matchesFilter = activeFilters.has(log.type);
            const matchesSearch = searchQuery === '' ||
                log.message.toLowerCase().includes(searchQuery);
            return matchesFilter && matchesSearch;
        });

        logsContainer.innerHTML = filtered.map(log => {
            const timestamp = log.time.toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                fractionalSecondDigits: 3
            });
            
            return `
                <div class="console-log-entry ${log.type}">
                    <span class="log-timestamp">${timestamp}</span>
                    <span class="log-message">${log.message}</span>
                </div>
            `;
        }).join('');

        logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    // Load existing console logs from buffer
    if (window.__customConsoleBuffer && window.__customConsoleBuffer.length > 0) {
        window.__customConsoleBuffer.forEach(logEntry => {
            addLog(logEntry.type, logEntry.args, logEntry.timestamp);
        });
    }

    // Update console interception to work with our addLog function
    const updateConsoleInterception = () => {
        console.log = function (...args) {
            originalLog.apply(console, args);
            addLog('log', args);
        };

        console.warn = function (...args) {
            originalWarn.apply(console, args);
            addLog('warn', args);
        };

        console.error = function (...args) {
            originalError.apply(console, args);
            addLog('error', args);
        };

        console.info = function (...args) {
            originalInfo.apply(console, args);
            addLog('info', args);
        };

        console.debug = function (...args) {
            originalDebug.apply(console, args);
            addLog('debug', args);
        };
    };

    // Apply the updated console interception
    updateConsoleInterception();

    console.log('🎉 Console Viewer is ready!');

    // Initial resize after a short delay to ensure panel is rendered
    setTimeout(autoResizeTextarea, 100);
};
//# sourceMappingURL=custom-console.cjs.js.map
