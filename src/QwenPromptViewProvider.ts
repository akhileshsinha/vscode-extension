import * as vscode from "vscode";

const QWEN_API_URL =
  "http://localhost:8000/generate-code";

export class QwenPromptViewProvider
  implements vscode.WebviewViewProvider
{
  public static readonly viewType =
    "qwen-local-coder.promptView";

  private webviewView:
    vscode.WebviewView | undefined;

  constructor(
    private readonly extensionUri: vscode.Uri,
  ) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
  ) {
    this.webviewView = webviewView;

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
        }

        if (
          message.command ===
          "applyResponse"
        ) {
          await this.applyResponse(
            message.response,
          );
        }
      },
    );
  }

  public setSelectedCode(
    code: string,
  ) {
    this.webviewView?.webview.postMessage({
      command: "selectedCode",
      code,
    });
  }

  private async askQwen(
    prompt: string,
    webviewView: vscode.WebviewView,
  ) {
    try {
      webviewView.webview.postMessage({
        command: "status",
        message:
          "Qwen is thinking...",
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

  private async applyResponse(
    response: string,
  ) {
    const editor =
      vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showWarningMessage(
        "No active editor found.",
      );

      return;
    }

    const selection =
      editor.selection;

    await editor.edit(
      (editBuilder) => {
        editBuilder.replace(
          selection,
          response,
        );
      },
    );

    vscode.window.showInformationMessage(
      "Qwen response applied to the editor.",
    );
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