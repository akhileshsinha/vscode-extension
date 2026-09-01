import * as vscode from "vscode";
import { QwenPromptViewProvider } from "./QwenPromptViewProvider";

const QWEN_API_URL =
  "http://localhost:8000/generate-code";

export function activate(
  context: vscode.ExtensionContext,
) {
  console.log(
    'Qwen Local Coder extension "qwen-local-coder" is now active.',
  );

  /*
   * Register Qwen Coder sidebar
   */
  const provider =
    new QwenPromptViewProvider(
      context.extensionUri,
    );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      QwenPromptViewProvider.viewType,
      provider,
    ),
  );

  /*
   * Register:
   * QWEN: Ask Qwen Coder
   *
   * Sends selected code to the
   * /generate-code endpoint.
   */
  const disposable =
    vscode.commands.registerCommand(
      "qwen-local-coder.ask",
      async () => {
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

        const selectedCode =
          editor.document.getText(
            selection,
          );

        if (!selectedCode.trim()) {
          vscode.window.showWarningMessage(
            "Please select some code first.",
          );

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
          vscode.window.showInformationMessage(
            "Qwen Coder is processing...",
          );

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

          showQwenResponse(
            data.response,
          );
        } catch (error) {
          console.error(
            "Qwen API error:",
            error,
          );

          vscode.window.showErrorMessage(
            "Unable to connect to local Qwen Coder.",
          );
        }
      },
    );

  context.subscriptions.push(
    disposable,
  );
}

/*
 * Display Qwen response in the
 * VS Code Output panel.
 */
function showQwenResponse(
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

export function deactivate() {}

