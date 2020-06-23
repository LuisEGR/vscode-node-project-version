import * as vscode from 'vscode';

const buffer2string = (buffer: Uint8Array) => {
  let str = '';
  for (let idx = 0; idx < buffer.length; idx++) {
    str += String.fromCharCode(buffer[idx]);
  }
  return str;
};

export class Extension {
  public static ID = 'Luis.node-project-version';

  protected _statusBar: vscode.StatusBarItem;
  protected _outputChannel: vscode.OutputChannel;
  protected _commands: Map<string, vscode.Disposable>;
  protected _disposables: vscode.Disposable[] = [];

  public constructor(private readonly _context: vscode.ExtensionContext) {
    this.update = this.update.bind(this);
    this._commands = new Map<string, vscode.Disposable>();

    this._registerCommands();
    this._statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    this._statusBar.command = 'extension.update';
    this._context.subscriptions.push(this._statusBar);

    this._outputChannel = vscode.window.createOutputChannel(Extension.ID);
    this._context.subscriptions.push(this._outputChannel);

    this._registerEventHandlers();
  }

  public dispose(): void {
    this._statusBar.dispose();
    this._outputChannel.dispose();
    for (const it of this._disposables) {
      it.dispose();
    }
    for (const it of this._commands) {
      it[1].dispose();
    }
    this._commands = new Map<string, vscode.Disposable>();
  }

  public async update(): Promise<void> {
    const files = await vscode.workspace.findFiles('package.json', null, 1);
    if (files.length) {
      this._outputChannel.appendLine(JSON.stringify(files, null, 2));
      try {
        const buffer = await vscode.workspace.fs.readFile(files[0]);
        const test = buffer2string(buffer);
        const json = JSON.parse(test);
        this._statusBar.text = `${json.name} ${json.version}`;
        this._statusBar.show();
      } catch (error) {
        vscode.window.showErrorMessage(`Error reading ${files[0].path}`);
        this._outputChannel.appendLine(JSON.stringify(error, null, 2));
        this._statusBar.hide();
      }
    } else {
      this._outputChannel.appendLine('No `package.json` found');
      this._statusBar.text = '';
      this._statusBar.hide();
    }
  }

  private _registerCommands() {
    const commandId = 'extension.update';
    const command = vscode.commands.registerCommand(commandId, this.update);
    this._commands.set(commandId, command);
    this._context.subscriptions.push(command);
  }

  private _registerEventHandlers() {
    this._disposables.push(vscode.workspace.onDidChangeWorkspaceFolders(this.update));
    this._disposables.push(
      vscode.workspace.onDidChangeTextDocument(async (event) => {
        if (event.document.fileName.match(/.*package.json$/)) {
          await this.update();
        }
      }),
    );
  }
}

let extension: Extension | null = null;

export const activate = (context: vscode.ExtensionContext): Extension => {
  if (extension) {
    deactivate();
  }
  extension = new Extension(context);
  extension.update();
  return extension;
};

export const deactivate = (): void => {
  if (extension) {
    extension.dispose();
    extension = null;
  }
};
