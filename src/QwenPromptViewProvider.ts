import * as vscode from "vscode";

const QWEN_API_URL =
  "http://localhost:8000/generate-code";

export class QwenPromptViewProvider
  implements vscode.WebviewViewProvider
{
  public static readonly viewType =
    "qwen-local-coder.promptView";

  constructor(
    private readonly extensionUri: vscode.Uri,
  ) {}

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

    if (message.command === "showResponse") {
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

      output.appendLine(
        message.response,
      );

      output.show(true);

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
            "Content-Type": "application/json",
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

          #status {
            margin-top: 10px;

            font-size: 12px;

            opacity: 0.8;
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

        <div id="status"></div>

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

          button.addEventListener(
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
                  command: "showResponse",
                  response:
                    message.response
                });

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