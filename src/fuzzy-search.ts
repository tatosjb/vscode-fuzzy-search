import * as vscode from 'vscode';
import Search from './search';
import { Item } from './types';

export default class FuzzySearch {
  private search = new Search();
  private quickPick = vscode.window.createQuickPick<Item>();
  private timeout: any;

  constructor() {
    this.onDidChangeValue = this.onDidChangeValue.bind(this);
    this.onAccept = this.onAccept.bind(this);

    this.search.onData(filePaths => {
      try {
        this.quickPick.items = filePaths;
      } finally {
        this.quickPick.busy = false;
      }
    });

    this.quickPick.placeholder = "Fuzzy search";
    this.quickPick.matchOnDescription = true;
    this.quickPick.matchOnDetail = true;
    this.quickPick.onDidChangeValue(this.onDidChangeValue);
    this.quickPick.onDidAccept(this.onAccept);
    this.quickPick.show();

    this.find(' ');
  }

  private onDidChangeValue(value: String) {
    this.find(value);
  }

  private find(value: String) {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      this.quickPick.busy = true;
      this.search.search(value.toString());
    }, 200);
  }

  onAccept(e: any) {
    this.quickPick.selectedItems[0].uri
    && vscode.workspace.openTextDocument(this.quickPick.selectedItems[0].uri).then(doc => {
      vscode.window.showTextDocument(doc);
    });
    this.quickPick.hide();
  }
}
