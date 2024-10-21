import * as path    from 'path';
import * as vscode  from 'vscode';

export function documentSignature(document:vscode.TextDocument): string
{
    if(!document) {
        return "No document.";
    }

    return `${document.languageId} ${document.uri.scheme} v${document.version} ${path.basename(document.fileName)}`;
}
