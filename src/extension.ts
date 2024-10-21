//#< Imports and constants
import * as path 							from 'path';
import * as vscode 							from 'vscode';
import { Config } 							from './config';
import { log } 								from './log';
import { DocumentModel } 					from './document-model';
import { documentMap } 						from './document-map';
import { documentFoldingProvider }			from './document-folding-provider';
import { DocumentTreeViewProvider }			from './document-treeview-provider';
import { documentSignature }				from './document-signature';

const FILE = path.basename(__filename);
//#> Imports and constants

//#< Global variables
let activeEditor 			 : vscode.TextEditor        | undefined = undefined;
let documentModel 			 : DocumentModel		    | undefined = undefined;
let documentTreeViewProvider : DocumentTreeViewProvider | undefined = undefined;
//#> Global variables

//#( activate(context) -- Called when the extension is activated
//-( --------------------------------------------------------------------------------------------	
export function activate(context: vscode.ExtensionContext)
{
	log.info(`Extension "${Config.extensionName}" version ${Config.extensionVersion} is now active.`);

	//-1 -----------------------------------------------------------------------------------------
	//#1 Register the navigation tree view
	//-1 -----------------------------------------------------------------------------------------
	documentTreeViewProvider = new DocumentTreeViewProvider(context);

	context.subscriptions.push(
		vscode.window.createTreeView('foldmore-view', { treeDataProvider: documentTreeViewProvider, showCollapseAll: true })
	);

	//-1 -----------------------------------------------------------------------------------------
	//#1 Handle active editor changes
	//-1 -----------------------------------------------------------------------------------------
	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if(editor) {
			log.debug(`[${FILE}] onDidChangeActiveTextEditor() - active editor.`);
			triggerViewUpdates(editor.document, true);
		} else {
			log.debug(`[${FILE}] onDidChangeActiveTextEditor() - no editor.`);
		}
	}, null, context.subscriptions);

	//-1 -----------------------------------------------------------------------------------------
	//#1 Handle document changes
	//-1 -----------------------------------------------------------------------------------------
	vscode.workspace.onDidChangeTextDocument(event => {
		//
		// Do not log here, it will be called too often!
		//
		//log.trace(`[${FILE}] onDidChangeTextDocument()`);
		triggerViewUpdates(event.document, true);
	}, null, context.subscriptions);

	//-1 -----------------------------------------------------------------------------------------
	//#1 Register the folding range provider for the supported languages
	//-1 -----------------------------------------------------------------------------------------
	context.subscriptions.push(vscode.languages.registerFoldingRangeProvider({ language: 'javascript', scheme: "file" }, documentFoldingProvider));
	context.subscriptions.push(vscode.languages.registerFoldingRangeProvider({ language: 'typescript', scheme: "file" }, documentFoldingProvider));

	//-1 -----------------------------------------------------------------------------------------
	//#1 Trigger the initial view update
	//-1 -----------------------------------------------------------------------------------------
	if(activeEditor = vscode.window.activeTextEditor) {
		triggerViewUpdates(activeEditor.document, true);
	}
} 
//#) activate(context)

//#( deactivate() -- Called when the extension is deactivated
//-( --------------------------------------------------------------------------------------------
export function deactivate()
{
	log.info(`Extension "${Config.extensionName}" version ${Config.extensionVersion} deactivated.`);
}
//#) deactivate()

//#( triggerViewUpdates(document, throttle) -- Trigger view updates for the given document
//-( --------------------------------------------------------------------------------------------

let timeout	: NodeJS.Timer|undefined = undefined;

function  triggerViewUpdates(document:vscode.TextDocument, throttle = false) 
{
	//
	// Do not log here, it will be called too often!
	//
	//log.trace(`[${FILE}] triggerViewUpdates() ${documentSignature(document)}`);

	//#1 Only process supported schemas
	if(document.languageId === 'log' || document.uri.scheme === 'log') 
	{
		return;
	}

	//#1 Only process languages defined in the package.json activationEvents
	if(Config.supportedLanguages.indexOf(document.languageId) === -1) {
		return;
	}

	//#1 Insert/update the document to the documentMap
	documentModel = documentMap.upsert(document);

	//#1 Trigger view updates, but throttle if requested
	if (timeout) {
		clearTimeout(timeout);
		timeout = undefined;
	}
	if (throttle) {
		timeout = setTimeout(fireViewUpdates, 200);
	} else {
		fireViewUpdates();
	}
} 
//#) triggerViewUpdates(document, throttle)

//#( fireViewUpdates() -- Fire view updates
//-( --------------------------------------------------------------------------------------------
function fireViewUpdates()
{
	log.trace(`[${FILE}] fireViewUpdates() ${documentModel ? documentSignature(documentModel.document) : "No document."}`);

	//#1 Parse the document if not yet parsed.
	if(!documentModel) {
		return;
	}
	if(!documentModel.isParsed) {
		documentModel.parseDocument();
	}

	//#1 Update views
	if(activeEditor) {
		
		//#2 Apply all document decorations
		for(let decoration of documentModel.decorations) {
			activeEditor.setDecorations(decoration.style, decoration.options);
		}
		
		//#2 Update the tree view
		if(documentModel?.treeModel) {
			documentTreeViewProvider?.setDocumentTreeModel(documentModel.treeModel);
		}
		
	}

} 
//#) fireViewUpdates()
