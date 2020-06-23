import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';

import * as TestSubject from '../../extension';

import { after, before, beforeEach } from 'mocha';

const getExtension = () => {
  const extension = vscode.extensions.getExtension<TestSubject.Extension>(TestSubject.Extension.ID);
  if (!extension) throw Error('Extension not found');
  return extension;
};

const getContext = (extension: TestSubject.Extension) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (extension as any)._context as vscode.ExtensionContext;
};

const getCommands = (extension: TestSubject.Extension) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (extension as any)._commands as Map<string, vscode.Disposable>;
};

type T = { shjd: string };
type Y = Readonly<T>;

const string2array = (str: string) => {
  const arr = [];
  for (let i = 0, j = str.length; i < j; ++i) {
    arr.push(str.charCodeAt(i));
  }
  return new Uint8Array(arr);
};

suite('Extension Test Suite', () => {
  const sandbox = sinon.createSandbox();
  const fsMock = sandbox.mock(vscode.workspace.fs);
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
  const statusBarHideSpy = sandbox.spy(statusBar, 'hide');
  const statusBarShowSpy = sandbox.spy(statusBar, 'show');
  const createStatusBarItemStub = sandbox.stub(vscode.window, 'createStatusBarItem').returns(statusBar);
  const outputChannel = vscode.window.createOutputChannel('test');
  const createOutputChannelSub = sandbox.stub(vscode.window, 'createOutputChannel').returns(outputChannel);
  const outputChannelAppendLineSpy = sandbox.spy(outputChannel, 'appendLine');
  const activateSpy = sandbox.spy(TestSubject, 'activate');

  after(() => {
    vscode.window.showInformationMessage('All tests finished.');
  });

  before(async () => {
    vscode.window.showInformationMessage('Start all tests.');
  });

  suite('exports', () => {
    test('should export `Extension`', () => {
      assert.ok(TestSubject.Extension);
    });

    test('should export activate', () => {
      assert.ok(TestSubject.activate);
    });

    test('should export deactivate', () => {
      assert.ok(TestSubject.deactivate);
    });
  });

  suite('initialization', () => {
    const extension = getExtension();

    test('extension should be registered', () => {
      assert.ok(extension);
    });

    test('extension should not be activate', async () => {
      assert.ok(!extension.isActive);
    });

    test('extension should activate', async () => {
      await extension.activate();
      assert.ok(extension.isActive);
      assert(activateSpy.calledOnce);
    });

    test('active extension should export extension instance', async () => {
      assert.ok(extension.exports instanceof TestSubject.Extension);
    });

    suite('statusbar', () => {
      test('status bar should have been created on the right side', async () => {
        assert(createStatusBarItemStub.calledOnceWithExactly(vscode.StatusBarAlignment.Right));
        assert(createStatusBarItemStub.returned(statusBar));
        assert.strictEqual(statusBar.command, 'extension.update');
      });
      test('status bar should be asssociated with `extension.update` command', async () => {
        assert.strictEqual(statusBar.command, 'extension.update');
      });
      test('status bar should be added to context subscriptions', () => {
        const context = getContext(extension.exports);
        assert.ok(context.subscriptions.includes(statusBar));
      });
    });

    suite('output', () => {
      test('output channel should have been created', async () => {
        assert(createOutputChannelSub.calledOnceWith(TestSubject.Extension.ID));
      });
      test('output channel should be added to context subscriptions', () => {
        const context = getContext(extension.exports);
        assert.ok(context.subscriptions.includes(outputChannel));
      });
    });

    suite('commands', () => {
      test('extension should contain `extension.update` command', () => {
        const commands = getCommands(extension.exports);
        assert.ok(commands.has('extension.update'));
      });

      test('extension `extension.update` command should be added to context subscriptions', () => {
        const commands = getCommands(extension.exports);
        const context = getContext(extension.exports);
        const command = commands.get('extension.update');
        if (command) assert.ok(context.subscriptions.includes(command));
      });
    });
  });

  suite('update', () => {
    const extension = getExtension();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let workspaceMock: any;

    beforeEach(() => {
      sandbox.reset();
      workspaceMock = sandbox.mock(vscode.workspace);
    });

    test('the statusbar should hide and its `text` property should be empty', async () => {
      const stubFindFiled = workspaceMock.expects('findFiles').returns(Promise.resolve([]));
      await extension.exports.update();
      workspaceMock.verify();

      assert(stubFindFiled.calledOnceWith('package.json', null, 1));
      assert(statusBarHideSpy.calledOnce);
      assert.strictEqual(statusBar.text, '');
    });

    test('the statusbar should show and its `text` property should be abc 0.0.1', async () => {
      const uri = { path: '123' } as vscode.Uri;
      const files = Promise.resolve([uri]);
      const stubFindFiles = workspaceMock.expects('findFiles').returns(files);
      const string = `{"name": "abc", "version": "0.0.1"}`;
      const stubReadFile = fsMock.expects('readFile').returns(Promise.resolve(string2array(string)));

      await extension.exports.update();
      workspaceMock.verify();

      assert(stubFindFiles.calledOnceWith('package.json', null, 1));
      assert.equal(stubFindFiles.returnValues[0], files);
      assert(stubReadFile.calledOnceWith(uri));
      assert(outputChannelAppendLineSpy.calledOnce);
      assert(statusBarShowSpy.calledOnce);
      assert.strictEqual(statusBar.text, 'abc 0.0.1');
    });
  });
});
