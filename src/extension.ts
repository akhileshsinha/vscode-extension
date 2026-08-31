import * as vscode from "vscode";
import {
  QwenPromptViewProvider,
} from "./QwenPromptViewProvider";

export function activate(
  context: vscode.ExtensionContext,
) {
  console.log(
    "Qwen Local Coder extension activated.",
  );

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

  const disposable =
    vscode.commands.registerCommand(
      "qwen-local-coder.ask",
      () => {
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

        provider.setSelectedCode(
          selectedCode,
        );

        vscode.commands.executeCommand(
          "qwen-local-coder.promptView.focus",
        );
      },
    );

  context.subscriptions.push(
    disposable,
  );
}

export function deactivate() {}