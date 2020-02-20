import { Item } from './types';
const { spawn } = require('child_process');
import * as path from 'path';
import * as vscode from 'vscode';

interface DataResultCallback {
  (filePaths: Item[]): void
}

function getOsPath(): String {
  const extensionPath = vscode.extensions.getExtension('tatosjb.fuzzy-search')?.extensionPath;

  switch (process.platform) {
    case 'darwin':
      return `${extensionPath}/binaries/darwin`;
    case 'win32':
      return `${extensionPath}/binaries/windows`;
    case 'linux':
      return `${extensionPath}/binaries/linux`;
    default:
      return `${extensionPath}/binaries/linux`;
  }
};

function getFdPath(): string {
  return process.platform === 'win32' ? `${getOsPath()}/fd.exe` : `${getOsPath()}/fd`;
};

function getFzfPath(): string {
  return process.platform === 'win32' ? `${getOsPath()}/fzf.exe` : `${getOsPath()}/fzf`;
};

function buildSearch(fd: string, fzf: string, text: string): string {
  const path = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0].uri.path;

  return text ? `${fd} --type f . '${path || ''}' | ${fzf} -m -f '${text}'\n` : '';
}

export default class Search {
  private sh = spawn('sh', []);
  private fzfPath = getFzfPath();
  private fdPath = getFdPath();
  private onDataListeners: DataResultCallback[];
  private fileNames: Item[];
  private searchString: string;

  constructor(){
    this.onDataListeners = [];
    this.fileNames = [];
    this.searchString = '';

    this.onResultData = this.onResultData.bind(this);

    this.sh.stdout.on('data', this.onResultData);
  }

  private onResultData(data: string) {
    const workspacePath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0].uri.path;
    this.fileNames = this.fileNames
      .concat(data.toString()
          .split('\n')
            .filter(filePath => filePath.trim() !== '')
            .map((filePath) => {
              return {
                label: `${path.parse(filePath).dir.replace(/.*(\/|\\)/, '')}/${path.parse(filePath).base}`,
                description: `${this.searchString} - ${path.parse(filePath).dir.replace(workspacePath || '', '')}`,
                awaysShow: true,
                uri: vscode.Uri.file(filePath)
              };
          })
      ).slice(0, 10)
      .map((item, index) => {
        return item.label.startsWith('$') ? item : {...item, label: `$${index} - ${item.label}`};
      });


    this.onDataListeners.forEach(listener => listener(this.fileNames));
  }

  search(text: string): void {
    this.fileNames = [];
    const command = buildSearch(this.fdPath, this.fzfPath, text.toLowerCase());
    this.searchString = text;

    this.sh.stdin.write(Buffer.from(command));
  }

  onData(callback: DataResultCallback){
    this.onDataListeners.push(callback);
  }
}
