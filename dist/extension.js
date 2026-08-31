/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(__webpack_require__(1));
const QwenPromptViewProvider_1 = __webpack_require__(2);
function activate(context) {
    console.log("Qwen Local Coder extension activated.");
    const provider = new QwenPromptViewProvider_1.QwenPromptViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(QwenPromptViewProvider_1.QwenPromptViewProvider.viewType, provider));
    const disposable = vscode.commands.registerCommand("qwen-local-coder.ask", () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage("No active editor found.");
            return;
        }
        const selection = editor.selection;
        const selectedCode = editor.document.getText(selection);
        if (!selectedCode.trim()) {
            vscode.window.showWarningMessage("Please select some code first.");
            return;
        }
        provider.setSelectedCode(selectedCode);
        vscode.commands.executeCommand("qwen-local-coder.promptView.focus");
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QwenPromptViewProvider = void 0;
const vscode = __importStar(__webpack_require__(1));
const QWEN_API_URL = "http://localhost:8000/generate-code";
class QwenPromptViewProvider {
    extensionUri;
    static viewType = "qwen-local-coder.promptView";
    webviewView;
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
    }
    resolveWebviewView(webviewView) {
        this.webviewView = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
        };
        webviewView.webview.html =
            this.getHtml();
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.command === "askQwen") {
                await this.askQwen(message.prompt, webviewView);
            }
            if (message.command ===
                "applyResponse") {
                await this.applyResponse(message.response);
            }
        });
    }
    setSelectedCode(code) {
        this.webviewView?.webview.postMessage({
            command: "selectedCode",
            code,
        });
    }
    async askQwen(prompt, webviewView) {
        try {
            webviewView.webview.postMessage({
                command: "status",
                message: "Qwen is thinking...",
            });
            const response = await fetch(QWEN_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt,
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = (await response.json());
            webviewView.webview.postMessage({
                command: "response",
                response: data.response,
            });
        }
        catch (error) {
            console.error("Qwen API error:", error);
            webviewView.webview.postMessage({
                command: "error",
                message: "Unable to connect to local Qwen Coder.",
            });
        }
    }
    async applyResponse(response) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage("No active editor found.");
            return;
        }
        const selection = editor.selection;
        await editor.edit((editBuilder) => {
            editBuilder.replace(selection, response);
        });
        vscode.window.showInformationMessage("Qwen response applied to the editor.");
    }
    getHtml() {
        return `
      <!DOCTYPE html>

      <html>

      <head>

        <style>

          body {
            font-family:
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              sans-serif;

            padding: 10px;
          }

          .section-title {
            font-size: 12px;

            margin-bottom: 6px;

            opacity: 0.8;
          }

          #selected-code {
            width: 100%;

            box-sizing: border-box;

            max-height: 150px;

            overflow: auto;

            padding: 8px;

            border-radius: 6px;

            background:
              var(--vscode-textCodeBlock-background);

            font-family:
              monospace;

            font-size: 11px;

            white-space: pre-wrap;

            margin-bottom: 12px;
          }

          textarea {
            width: 100%;

            box-sizing: border-box;

            min-height: 90px;

            resize: vertical;

            padding: 8px;

            border-radius: 6px;

            border: 1px solid
              var(--vscode-input-border);

            background:
              var(--vscode-input-background);

            color:
              var(--vscode-input-foreground);

            font-family: inherit;
          }

          button {
            width: 100%;

            margin-top: 8px;

            padding: 7px;

            border: none;

            border-radius: 5px;

            background:
              var(--vscode-button-background);

            color:
              var(--vscode-button-foreground);

            cursor: pointer;
          }

          button:hover {
            background:
              var(--vscode-button-hoverBackground);
          }

          #apply {
            background:
              var(--vscode-testing-iconPassed);
          }

          #status {
            margin-top: 10px;

            font-size: 12px;

            opacity: 0.8;
          }

          #response {
            margin-top: 12px;

            padding: 8px;

            border-radius: 6px;

            background:
              var(--vscode-textCodeBlock-background);

            white-space: pre-wrap;

            font-family:
              monospace;

            font-size: 11px;

            max-height: 350px;

            overflow: auto;
          }

        </style>

      </head>

      <body>

        <div class="section-title">
          Selected Code
        </div>

        <div id="selected-code">
          No code selected.
        </div>

        <div class="section-title">
          What would you like Qwen to do?
        </div>

        <textarea
          id="prompt"
          placeholder="Explain, optimize, refactor, fix..."
        ></textarea>

        <button id="ask">
          Ask Qwen
        </button>

        <div id="status"></div>

        <div
          id="response"
          style="display:none;"
        ></div>

        <button
          id="apply"
          style="display:none;"
        >
          Apply Changes
        </button>

        <script>

          const vscode =
            acquireVsCodeApi();

          const prompt =
            document.getElementById(
              "prompt"
            );

          const button =
            document.getElementById(
              "ask"
            );

          const status =
            document.getElementById(
              "status"
            );

          const selectedCode =
            document.getElementById(
              "selected-code"
            );

          const responseBox =
            document.getElementById(
              "response"
            );

          const applyButton =
            document.getElementById(
              "apply"
            );

          let currentCode = "";

          let currentResponse = "";

          button.addEventListener(
            "click",
            () => {

              const instruction =
                prompt.value.trim();

              if (!instruction) {
                return;
              }

              if (!currentCode) {

                status.textContent =
                  "Please select some code first.";

                return;
              }

              const combinedPrompt = \`
Instruction:
\${instruction}

Selected code:
\${currentCode}
\`;

              vscode.postMessage({
                command: "askQwen",
                prompt: combinedPrompt
              });

              status.textContent =
                "Sending to Qwen Coder...";

              responseBox.style.display =
                "none";

              applyButton.style.display =
                "none";
            }
          );

          applyButton.addEventListener(
            "click",
            () => {

              if (!currentResponse) {
                return;
              }

              vscode.postMessage({
                command:
                  "applyResponse",

                response:
                  currentResponse
              });

              status.textContent =
                "Changes applied.";
            }
          );

          window.addEventListener(
            "message",
            event => {

              const message =
                event.data;

              if (
                message.command ===
                "selectedCode"
              ) {

                currentCode =
                  message.code;

                selectedCode.textContent =
                  currentCode;
              }

              if (
                message.command ===
                "status"
              ) {

                status.textContent =
                  message.message;
              }

              if (
                message.command ===
                "response"
              ) {

                currentResponse =
                  message.response;

                status.textContent =
                  "Response received.";

                responseBox.style.display =
                  "block";

                responseBox.textContent =
                  currentResponse;

                applyButton.style.display =
                  "block";
              }

              if (
                message.command ===
                "error"
              ) {

                status.textContent =
                  message.message;
              }

            }
          );

        </script>

      </body>

      </html>
    `;
    }
}
exports.QwenPromptViewProvider = QwenPromptViewProvider;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	const __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		const cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		const module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	let __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map