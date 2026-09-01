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
const QWEN_API_URL = "http://localhost:8000/generate-code";
function activate(context) {
    console.log('Qwen Local Coder extension "qwen-local-coder" is now active.');
    /*
     * Register Qwen Coder sidebar
     */
    const provider = new QwenPromptViewProvider_1.QwenPromptViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(QwenPromptViewProvider_1.QwenPromptViewProvider.viewType, provider));
    /*
     * Register:
     * QWEN: Ask Qwen Coder
     *
     * Sends selected code to the
     * /generate-code endpoint.
     */
    const disposable = vscode.commands.registerCommand("qwen-local-coder.ask", async () => {
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
        const prompt = `
Please analyze the following code.

Explain what it does, identify any potential
issues, and suggest improvements where appropriate.

Code:

${selectedCode}
`;
        try {
            vscode.window.showInformationMessage("Qwen Coder is processing...");
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
            showQwenResponse(data.response);
        }
        catch (error) {
            console.error("Qwen API error:", error);
            vscode.window.showErrorMessage("Unable to connect to local Qwen Coder.");
        }
    });
    context.subscriptions.push(disposable);
}
/*
 * Display Qwen response in the
 * VS Code Output panel.
 */
function showQwenResponse(response) {
    const output = vscode.window.createOutputChannel("Qwen Local Coder");
    output.clear();
    output.appendLine("==============================");
    output.appendLine("       QWEN LOCAL CODER");
    output.appendLine("==============================");
    output.appendLine("");
    output.appendLine(response);
    output.show(true);
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
const QWEN_PROJECT_API_URL = "http://localhost:8000/generate-project";
class QwenPromptViewProvider {
    extensionUri;
    static viewType = "qwen-local-coder.promptView";
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
    }
    async getWorkspaceFiles() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders ||
            workspaceFolders.length === 0) {
            return [];
        }
        const workspaceRoot = workspaceFolders[0].uri;
        const files = [];
        const collectFiles = async (directory, relativePath = "") => {
            const entries = await vscode.workspace.fs.readDirectory(directory);
            for (const [name, type] of entries) {
                const currentRelativePath = relativePath
                    ? `${relativePath}/${name}`
                    : name;
                const currentUri = vscode.Uri.joinPath(directory, name);
                if (type === vscode.FileType.Directory) {
                    if (name === "node_modules" ||
                        name === ".git" ||
                        name === "dist" ||
                        name === "build" ||
                        name === ".next" ||
                        name === ".venv") {
                        continue;
                    }
                    await collectFiles(currentUri, currentRelativePath);
                }
                else if (type === vscode.FileType.File) {
                    try {
                        const content = await vscode.workspace.fs.readFile(currentUri);
                        files.push({
                            path: currentRelativePath,
                            content: Buffer.from(content).toString("utf8"),
                        });
                    }
                    catch (error) {
                        console.warn(`Unable to read ${currentRelativePath}`, error);
                    }
                }
            }
        };
        await collectFiles(workspaceRoot);
        return files;
    }
    resolveWebviewView(webviewView) {
        webviewView.webview.options = {
            enableScripts: true,
        };
        webviewView.webview.html =
            this.getHtml();
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.command === "askQwen") {
                await this.askQwen(message.prompt, webviewView);
                return;
            }
            if (message.command ===
                "generateProject") {
                await this.generateProject(message.prompt, webviewView);
                return;
            }
            if (message.command ===
                "createProject") {
                await this.createProject(message.actions, webviewView);
                return;
            }
            if (message.command ===
                "showResponse") {
                this.showResponse(message.response);
                return;
            }
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
    async generateProject(prompt, webviewView) {
        try {
            webviewView.webview.postMessage({
                command: "status",
                message: "Qwen is designing your project...",
            });
            const response = await fetch(QWEN_PROJECT_API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt,
                    workspace: {
                        files: await this.getWorkspaceFiles(),
                    },
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = (await response.json());
            webviewView.webview.postMessage({
                command: "projectResponse",
                response: data,
            });
        }
        catch (error) {
            console.error("Qwen project generation error:", error);
            webviewView.webview.postMessage({
                command: "error",
                message: "Unable to generate the project.",
            });
        }
    }
    async createProject(actions, webviewView) {
        try {
            if (!actions ||
                !Array.isArray(actions) ||
                actions.length === 0) {
                throw new Error("No project actions were provided.");
            }
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders ||
                workspaceFolders.length === 0) {
                vscode.window.showErrorMessage("Please open a workspace folder before applying changes.");
                return;
            }
            const workspaceRoot = workspaceFolders[0].uri;
            /*
             * Show confirmation before modifying
             * the user's workspace.
             */
            const confirmed = await vscode.window.showWarningMessage(`Qwen wants to apply ${actions.length} file change(s). Continue?`, {
                modal: true,
            }, "Apply Changes");
            if (confirmed !== "Apply Changes") {
                webviewView.webview.postMessage({
                    command: "projectCancelled",
                    message: "Changes cancelled.",
                });
                return;
            }
            webviewView.webview.postMessage({
                command: "status",
                message: "Applying Qwen changes...",
            });
            let createdFiles = 0;
            let modifiedFiles = 0;
            let deletedFiles = 0;
            for (const action of actions) {
                if (!action.path) {
                    continue;
                }
                /*
                 * Prevent path traversal.
                 */
                const normalizedPath = action.path.replace(/\\/g, "/");
                if (normalizedPath.startsWith("/") ||
                    normalizedPath.includes("../") ||
                    normalizedPath === "..") {
                    console.warn(`Skipping unsafe path: ${action.path}`);
                    continue;
                }
                const fileUri = vscode.Uri.joinPath(workspaceRoot, normalizedPath);
                /*
                 * CREATE FILE
                 */
                if (action.type === "create_file") {
                    if (typeof action.content !==
                        "string") {
                        continue;
                    }
                    /*
                     * Don't overwrite an existing file
                     * with create_file.
                     */
                    try {
                        await vscode.workspace.fs.stat(fileUri);
                        console.warn(`Skipping create_file because file already exists: ${action.path}`);
                        continue;
                    }
                    catch {
                        /*
                         * File doesn't exist.
                         * Continue with creation.
                         */
                    }
                    await vscode.workspace.fs.writeFile(fileUri, Buffer.from(action.content, "utf8"));
                    createdFiles++;
                    continue;
                }
                /*
                 * MODIFY FILE
                 */
                if (action.type === "modify_file") {
                    if (typeof action.content !==
                        "string") {
                        continue;
                    }
                    /*
                     * Make sure the file exists.
                     */
                    try {
                        await vscode.workspace.fs.stat(fileUri);
                    }
                    catch {
                        console.warn(`Skipping modify_file because file does not exist: ${action.path}`);
                        continue;
                    }
                    await vscode.workspace.fs.writeFile(fileUri, Buffer.from(action.content, "utf8"));
                    modifiedFiles++;
                    continue;
                }
                /*
                 * DELETE FILE
                 */
                if (action.type === "delete_file") {
                    try {
                        await vscode.workspace.fs.stat(fileUri);
                    }
                    catch {
                        console.warn(`Skipping delete_file because file does not exist: ${action.path}`);
                        continue;
                    }
                    await vscode.workspace.fs.delete(fileUri, {
                        useTrash: true,
                    });
                    deletedFiles++;
                    continue;
                }
            }
            /*
             * Refresh VS Code explorer.
             */
            await vscode.commands.executeCommand("workbench.action.files.refreshFilesExplorer");
            const summary = [
                createdFiles > 0
                    ? `${createdFiles} created`
                    : "",
                modifiedFiles > 0
                    ? `${modifiedFiles} modified`
                    : "",
                deletedFiles > 0
                    ? `${deletedFiles} deleted`
                    : "",
            ]
                .filter(Boolean)
                .join(", ");
            const message = summary
                ? `Qwen changes applied successfully: ${summary}.`
                : "No changes were applied.";
            webviewView.webview.postMessage({
                command: "projectCreated",
                message,
            });
            vscode.window.showInformationMessage(message);
        }
        catch (error) {
            console.error("Project application error:", error);
            webviewView.webview.postMessage({
                command: "error",
                message: "Unable to apply Qwen changes.",
            });
            vscode.window.showErrorMessage("Unable to apply Qwen changes.");
        }
    }
    showResponse(response) {
        const output = vscode.window.createOutputChannel("Qwen Local Coder");
        output.clear();
        output.appendLine("==============================");
        output.appendLine("       QWEN LOCAL CODER");
        output.appendLine("==============================");
        output.appendLine("");
        output.appendLine(response);
        output.show(true);
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

          textarea {
            width: 100%;
            box-sizing: border-box;

            min-height: 100px;

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

          button:disabled {
            opacity: 0.5;
            cursor: default;
          }

          #status {
            margin-top: 10px;

            font-size: 12px;

            opacity: 0.8;
          }

          #project {
            margin-top: 15px;
          }

          .project-message {
            margin-bottom: 12px;

            font-size: 13px;
          }

          .file {
            padding: 5px 0;

            font-family: monospace;

            font-size: 12px;
          }

          .create-button {
            margin-top: 15px;
          }

        </style>

      </head>

      <body>

        <textarea
          id="prompt"
          placeholder="Ask Qwen Coder..."
        ></textarea>

        <button id="ask">
          Ask Qwen
        </button>

        <button id="generateProject">
          Generate Project
        </button>

        <div id="status"></div>

        <div id="project"></div>

        <script>

          const vscode =
            acquireVsCodeApi();

          const prompt =
            document.getElementById(
              "prompt"
            );

          const askButton =
            document.getElementById(
              "ask"
            );

          const generateProjectButton =
            document.getElementById(
              "generateProject"
            );

          const status =
            document.getElementById(
              "status"
            );

          const project =
            document.getElementById(
              "project"
            );

          let projectActions = [];

          askButton.addEventListener(
            "click",
            () => {

              const value =
                prompt.value.trim();

              if (!value) {
                return;
              }

              vscode.postMessage({
                command: "askQwen",
                prompt: value
              });

              status.textContent =
                "Sending to Qwen Coder...";

            }
          );

          generateProjectButton.addEventListener(
            "click",
            () => {

              const value =
                prompt.value.trim();

              if (!value) {
                return;
              }

              project.innerHTML = "";

              projectActions = [];

              vscode.postMessage({
                command:
                  "generateProject",
                prompt: value
              });

              status.textContent =
                "Generating project...";

            }
          );

          window.addEventListener(
            "message",
            event => {

              const message =
                event.data;

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

                status.textContent =
                  "Response received.";

                vscode.postMessage({
                  command:
                    "showResponse",
                  response:
                    message.response
                });

              }

              if (
                message.command ===
                "projectResponse"
              ) {

                const data =
                  message.response;

                projectActions =
                  data.actions || [];

                status.textContent =
                  "Project plan generated.";

                let html =
                  "<div class='project-message'>" +
                  data.message +
                  "</div>";

                html +=
                  "<strong>Files to create:</strong>";

                projectActions.forEach(
                  action => {

                    let icon = "📄";
                    let label = "Create";

                    if (action.type === "modify_file") {
                      icon = "✏️";
                      label = "Modify";
                    }

                    if (action.type === "delete_file") {
                      icon = "🗑️";
                      label = "Delete";
                    }

                    html +=
                      "<div class='file'>" +
                      icon +
                      " <strong>" +
                      label +
                      "</strong> " +
                      action.path +
                      "</div>";
                  }
                );

               html +=
                "<button id='createProject' class='create-button'>" +
                "Apply Changes" +
                "</button>";

                project.innerHTML =
                  html;

                const createButton =
                  document.getElementById(
                    "createProject"
                  );

                createButton.addEventListener(
                  "click",
                  () => {

                    if (
                      !projectActions.length
                    ) {
                      return;
                    }

                    createButton.disabled =
                      true;

                    createButton.textContent =
                      "Applying Changes...";

                    vscode.postMessage({
                      command:
                        "createProject",
                      actions:
                        projectActions
                    });

                  }
                );

              }

              if (
                message.command ===
                "projectCreated"
              ) {

                status.textContent =
                  message.message;

                const createButton =
                  document.getElementById(
                    "createProject"
                  );

                if (createButton) {
                  createButton.textContent =
                    "Changes Applied ✓";
                  createButton.disabled =
                    true;
                }

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