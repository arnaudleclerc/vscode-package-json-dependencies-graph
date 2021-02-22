import { OutputChannel, window } from 'vscode';

export class Logger {
    private static _outputChannel: OutputChannel;

    static initialize() {
        if (!this._outputChannel) {
            this._outputChannel = window.createOutputChannel('Graph');
        }
    }

    static getChannel() {
        this.initialize();
        return this._outputChannel;
    }

    static info(message: string) {
        this._outputChannel.appendLine(message);
    }
}