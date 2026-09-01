import * as vscode from "vscode";

const QWEN_API_URL =
  "http://localhost:8000/generate-code";

const QWEN_PROJECT_API_URL =
  "http://localhost:8000/generate-project";

interface ProjectAction {
  type: string;
  path: string;
  content?: string;
}

interface ProjectResponse {
  message: string;
  actions: ProjectAction[];
}
interface WorkspaceFile {
  path: string;
  content: string;
}

export class QwenPromptViewProvider
  implements vscode.WebviewViewProvider
{
  public static readonly viewType =
    "qwen-local-coder.promptView";

  constructor(
    private readonly extensionUri: vscode.Uri,
  ) {}


private async getWorkspaceFiles(): Promise<WorkspaceFile[]> {
  const workspaceFolders =
    vscode.workspace.workspaceFolders;

  if (
    !workspaceFolders ||
    workspaceFolders.length === 0
  ) {
    return [];
  }

  const workspaceRoot =
    workspaceFolders[0].uri;

  const files: WorkspaceFile[] = [];

  const collectFiles = async (
    directory: vscode.Uri,
    relativePath = "",
  ): Promise<void> => {
    const entries =
      await vscode.workspace.fs.readDirectory(
        directory,
      );

    for (const [name, type] of entries) {
      const currentRelativePath =
        relativePath
          ? `${relativePath}/${name}`
          : name;

      const currentUri =
        vscode.Uri.joinPath(
          directory,
          name,
        );

      if (
        type === vscode.FileType.Directory
      ) {
        if (
          name === "node_modules" ||
          name === ".git" ||
          name === "dist" ||
          name === "build" ||
          name === ".next" ||
          name === ".venv"
        ) {
          continue;
        }

        await collectFiles(
          currentUri,
          currentRelativePath,
        );

      } else if (
        type === vscode.FileType.File
      ) {
        try {
          const content =
            await vscode.workspace.fs.readFile(
              currentUri,
            );

          files.push({
            path: currentRelativePath,
            content:
              Buffer.from(content).toString("utf8"),
          });

        } catch (error) {
          console.warn(
            `Unable to read ${currentRelativePath}`,
            error,
          );
        }
      }
    }
  };

  await collectFiles(workspaceRoot);

  return files;
}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
  ) {
    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html =
      this.getHtml();

    webviewView.webview.onDidReceiveMessage(
      async (message) => {
        if (message.command === "askQwen") {
          await this.askQwen(
            message.prompt,
            webviewView,
          );

          return;
        }

        if (
          message.command ===
          "generateProject"
        ) {
          await this.generateProject(
            message.prompt,
            webviewView,
          );

          return;
        }

        if (
          message.command ===
          "createProject"
        ) {
          await this.createProject(
            message.actions,
            webviewView,
          );

          return;
        }

        if (
          message.command ===
          "showResponse"
        ) {
          this.showResponse(
            message.response,
          );

          return;
        }
      },
    );
  }

  private async askQwen(
    prompt: string,
    webviewView: vscode.WebviewView,
  ) {
    try {
      webviewView.webview.postMessage({
        command: "status",
        message: "Qwen is thinking...",
      });

      const response = await fetch(
        QWEN_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            prompt,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`,
        );
      }

      const data =
        (await response.json()) as {
          response: string;
        };

      webviewView.webview.postMessage({
        command: "response",
        response: data.response,
      });
    } catch (error) {
      console.error(
        "Qwen API error:",
        error,
      );

      webviewView.webview.postMessage({
        command: "error",
        message:
          "Unable to connect to local Qwen Coder.",
      });
    }
  }

  private async generateProject(
    prompt: string,
    webviewView: vscode.WebviewView,
  ) {
    try {
      webviewView.webview.postMessage({
        command: "status",
        message:
          "Qwen is designing your project...",
      });

      const response = await fetch(
        QWEN_PROJECT_API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            prompt,
            workspace: {
              files: await this.getWorkspaceFiles(),
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}`,
        );
      }

      const data =
        (await response.json()) as ProjectResponse;

      webviewView.webview.postMessage({
        command: "projectResponse",
        response: data,
      });
    } catch (error) {
      console.error(
        "Qwen project generation error:",
        error,
      );

      webviewView.webview.postMessage({
        command: "error",
        message:
          "Unable to generate the project.",
      });
    }
  }

  private async createProject(
  actions: ProjectAction[],
  webviewView: vscode.WebviewView,
) {
  try {
    if (
      !actions ||
      !Array.isArray(actions) ||
      actions.length === 0
    ) {
      throw new Error(
        "No project actions were provided.",
      );
    }

    const workspaceFolders =
      vscode.workspace.workspaceFolders;

    if (
      !workspaceFolders ||
      workspaceFolders.length === 0
    ) {
      vscode.window.showErrorMessage(
        "Please open a workspace folder before applying changes.",
      );

      return;
    }

    const workspaceRoot =
      workspaceFolders[0].uri;

    /*
     * Show confirmation before modifying
     * the user's workspace.
     */
    const confirmed =
      await vscode.window.showWarningMessage(
        `Qwen wants to apply ${actions.length} file change(s). Continue?`,
        {
          modal: true,
        },
        "Apply Changes",
      );

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
      const normalizedPath =
        action.path.replace(/\\/g, "/");

      if (
        normalizedPath.startsWith("/") ||
        normalizedPath.includes("../") ||
        normalizedPath === ".."
      ) {
        console.warn(
          `Skipping unsafe path: ${action.path}`,
        );

        continue;
      }

      const fileUri =
        vscode.Uri.joinPath(
          workspaceRoot,
          normalizedPath,
        );

      /*
       * CREATE FILE
       */
      if (
        action.type === "create_file"
      ) {
        if (
          typeof action.content !==
          "string"
        ) {
          continue;
        }

        /*
         * Don't overwrite an existing file
         * with create_file.
         */
        try {
          await vscode.workspace.fs.stat(
            fileUri,
          );

          console.warn(
            `Skipping create_file because file already exists: ${action.path}`,
          );

          continue;
        } catch {
          /*
           * File doesn't exist.
           * Continue with creation.
           */
        }

        await vscode.workspace.fs.writeFile(
          fileUri,
          Buffer.from(
            action.content,
            "utf8",
          ),
        );

        createdFiles++;

        continue;
      }

      /*
       * MODIFY FILE
       */
      if (
        action.type === "modify_file"
      ) {
        if (
          typeof action.content !==
          "string"
        ) {
          continue;
        }

        /*
         * Make sure the file exists.
         */
        try {
          await vscode.workspace.fs.stat(
            fileUri,
          );
        } catch {
          console.warn(
            `Skipping modify_file because file does not exist: ${action.path}`,
          );

          continue;
        }

        await vscode.workspace.fs.writeFile(
          fileUri,
          Buffer.from(
            action.content,
            "utf8",
          ),
        );

        modifiedFiles++;

        continue;
      }

      /*
       * DELETE FILE
       */
      if (
        action.type === "delete_file"
      ) {
        try {
          await vscode.workspace.fs.stat(
            fileUri,
          );
        } catch {
          console.warn(
            `Skipping delete_file because file does not exist: ${action.path}`,
          );

          continue;
        }

        await vscode.workspace.fs.delete(
          fileUri,
          {
            useTrash: true,
          },
        );

        deletedFiles++;

        continue;
      }
    }

    /*
     * Refresh VS Code explorer.
     */
    await vscode.commands.executeCommand(
      "workbench.action.files.refreshFilesExplorer",
    );

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

    const message =
      summary
        ? `Qwen changes applied successfully: ${summary}.`
        : "No changes were applied.";

    webviewView.webview.postMessage({
      command: "projectCreated",
      message,
    });

    vscode.window.showInformationMessage(
      message,
    );
  } catch (error) {
    console.error(
      "Project application error:",
      error,
    );

    webviewView.webview.postMessage({
      command: "error",
      message:
        "Unable to apply Qwen changes.",
    });

    vscode.window.showErrorMessage(
      "Unable to apply Qwen changes.",
    );
  }
}

  private showResponse(
    response: string,
  ) {
    const output =
      vscode.window.createOutputChannel(
        "Qwen Local Coder",
      );

    output.clear();

    output.appendLine(
      "==============================",
    );

    output.appendLine(
      "       QWEN LOCAL CODER",
    );

    output.appendLine(
      "==============================",
    );

    output.appendLine("");

    output.appendLine(response);

    output.show(true);
  }

  private getHtml(): string {
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
