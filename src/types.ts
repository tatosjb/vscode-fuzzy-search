import * as vscode from 'vscode';

export interface Item extends vscode.QuickPickItem {
  uri?: vscode.Uri;
  // shortcut?: string;
  // symbol?: string;
  // range?: vscode.Range;
}

