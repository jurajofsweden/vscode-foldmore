import * as vscode          from 'vscode';
import * as path            from 'path';
import { log }		        from './log';
import { DocumentModel }    from './document-model';
import { documentMap }      from './document-map';

const FILE = path.basename(__filename);

//#{* DocumentFoldingProvider -- Provides folding ranges for the document.
//-{* -----------------------------------------------------------------------------------
class       DocumentFoldingProvider 
implements  vscode.FoldingRangeProvider 
{

    public provideFoldingRanges(document: vscode.TextDocument): vscode.ProviderResult<vscode.FoldingRange[]>
    {
        log.trace(`[${FILE}] DocumentFoldingProvider::provideFoldingRanges() ${document.languageId} ${document.uri.scheme} v${document.version} ${path.basename(document.uri.fsPath)}`);

        let documentModel: DocumentModel = documentMap.upsert(document);

        if(!documentModel.isParsed) {
            documentModel.parseDocument();
        }   

        return documentModel.foldRegions;

    } // provideFoldingRanges()

} 
//#*} DocumentFoldingProvider

//#{ documentFoldingProvider -- Singleton instance of the DocumentFoldingProvider.
//-{ -----------------------------------------------------------------------------------

export let documentFoldingProvider:DocumentFoldingProvider = new DocumentFoldingProvider();

//#} documentFoldingProvider
