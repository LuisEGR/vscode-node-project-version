const vscode = require('vscode');
const spawn = require('child_process').spawnSync;
const path = require('path');

export class StatusBarItem {
    _statusBarItem: any;
	_interval: any;

    constructor() {
        this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, -90);
		this._interval = setInterval(() => this.refreshUI(), 20 * 1000);
		
		this.refreshUI();
		this._statusBarItem.show();
	}
	
	dispose() {
		this._statusBarItem.dispose();
		clearInterval(this._interval);
	}
	
	refreshUI() {
		if(vscode.window.activeTextEditor){
			let file = vscode.window.activeTextEditor.document.uri.path;
			let dir = path.dirname(file);
			let version = spawn('node', ['-p', `require('./package.json').version`], {cwd: dir}).output[1];
			let name = spawn('node', ['-p', `require('./package.json').name`], {cwd: dir}).output[1];
			let texto = (name + ' ' + version).replace(/\n/g, '');
			// this._statusBarItem.text = texto;
			this._statusBarItem.text = "node-project-version 0.0.2";
		}
	}
}
