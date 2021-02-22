// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
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
			let f = vscode.workspace.workspaceFolders[0].uri.fsPath;

			readFile(`${f}\\package-lock.json`, (err, data) => {
				if (err) {
					vscode.window.showErrorMessage(err.message);
				} else {

					const panel = vscode.window.createWebviewPanel(
						'dependencyGraph', // Identifies the type of the webview. Used internally
						'Dependency Graph', // Title of the panel displayed to the user
						vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
						{
							enableScripts: true
						} // Webview options. More on these later.
					);


					const result = DependenciesParser.parse(JSON.parse(data.toString()));

					const nodes = JSON.stringify(result.nodes);
					const links = JSON.stringify(result.links);

					Logger.info(nodes);
					Logger.info(links);

					const d3jsPath = vscode.Uri.file(
						path.join(context.extensionPath, 'node_modules', 'd3', 'dist/d3.min.js')
					);
					const d3ForcePath = vscode.Uri.file(
						path.join(context.extensionPath, 'node_modules', 'd3-force', 'dist/d3-force.min.js')
					);

					const d3Src = panel.webview.asWebviewUri(d3jsPath);
					const d3ForceSrc = panel.webview.asWebviewUri(d3ForcePath);

					// And set its HTML content
					panel.webview.html = getWebviewContent(nodes, links, d3Src, d3ForceSrc);
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

function getWebviewContent(nodes: string, links: string, d3Src: vscode.Uri, d3ForceSrc: vscode.Uri) {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Cat Coding</title>
	  <script src="${d3Src}" />
	  <script src="${d3ForceSrc}" />
  </head>
  <body>
	<div id="dependencyGraphContainer">
	<script>
	const nodes = JSON.parse(${nodes});
	const links = JSON.parse(${links});
	const simulation = d3.forceSimulation(nodes)
		.force('link', d3.forceLink(links).id(d => d.id))
		.force("charge", d3.forceManyBody())
		.force("center", d3.forceCenter(300 / 2, 300 / 2));

	const svg = d3.select('#dependencyGraphContainer')
		.append('svg')
		.attr("width", 300)
		.attr('height', 300);

	const link = svg.append("g")
		.attr("stroke", "#999")
		.attr("stroke-opacity", 0.6)
		.selectAll("line")
		.data(links)
		.join("line")
		.attr("stroke-width", d => Math.sqrt(d.value));

	const node = svg.append("g")
		.attr("stroke", "#fff")
		.attr("stroke-width", 1.5)
		.selectAll("circle")
		.data(nodes)
		.join("circle")
		.attr("r", 5);
	// .attr("fill", color)
	// .call(drag());

	node.append("title")
		.text(d => d.id);

	simulation.on("tick", () => {
		link
			.attr("x1", d => d.source.x)
			.attr("y1", d => d.source.y)
			.attr("x2", d => d.source.x)
			.attr("y2", d => d.source.y);

		node
			.attr("cx", d => d.x)
			.attr("cy", d => d.y);
	});
	</script>
  </body>
  </html>`;
}
