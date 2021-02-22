// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { DependenciesParser } from './parser';
import { readFile } from 'fs';
import { Logger } from './logger';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vscode-package-json-dependencies-graph.parse', () => {
		Logger.initialize();

		// The code you place here will be executed every time your command is executed
		if (vscode.workspace.workspaceFolders !== undefined) {
			let wf = vscode.workspace.workspaceFolders[0].uri.path;
			let f = vscode.workspace.workspaceFolders[0].uri.fsPath;

			let message = `Graph Package JSON: folder: ${wf} - ${f}`;

			vscode.window.showInformationMessage(message);

			readFile(`${f}\\package-lock.json`, (err, data) => {
				if (err) {
					vscode.window.showErrorMessage(err.message);
				} else {

					const panel = vscode.window.createWebviewPanel(
						'dependencyGraph', // Identifies the type of the webview. Used internally
						'Dependency Graph', // Title of the panel displayed to the user
						vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
						{} // Webview options. More on these later.
					);

					// And set its HTML content
					panel.webview.html = getWebviewContent();

					vscode.window.showInformationMessage('Parsing');
					DependenciesParser.parse(JSON.parse(data.toString()));
				}
			});
		}
		else {
			let message = "Graph Package JSON: Working folder not found, open a folder an try again";

			vscode.window.showErrorMessage(message);
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(Logger.getChannel());
}

// this method is called when your extension is deactivated
export function deactivate() { }

function getWebviewContent() {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Cat Coding</title>
  </head>
  <body>
	<div id="dependencyGraphContainer">
  </body>
  </html>`;
}
