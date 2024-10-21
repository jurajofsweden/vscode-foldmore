import * as vscode                      from 'vscode';
import * as path                        from 'path';
import { DocumentModel }                from './document-model';
import { log } 						    from './log';

const FILE = path.basename(__filename);

//#{* DocumentMap -- Manages open documents in the workspace.
//-{* -----------------------------------------------------------------------------------
export class DocumentMap
{
    //#{ documents -- Map of open documents in the workspace.
    //-{ --------------------------------------------------------------------------------
    private documents: Map<string, DocumentModel> = new Map();
    //#} documents

    //#( clear() -- Clears the document map.
    //-( --------------------------------------------------------------------------------
    public clear(): void
    {
        log.trace(`[${FILE}] DocumentMap::clear()`);

        this.documents.clear();
    }
    //#) clear()

    //#( upsert() -- Adds or updates a document in the map.
    //-( --------------------------------------------------------------------------------
    public upsert(document: vscode.TextDocument): DocumentModel
    {
        log.trace(`[${FILE}] DocumentMap::upsert()`);

        const documentUri       				        = this.docUri(document);
        let   documentModel: DocumentModel|undefined    = this.documents.get(documentUri);
    
        //#1 Create document data if not found in the map
        if(!documentModel) {
            log.debug(`[${FILE}] DocumentMap::upsert() NEW v${document.version} ${document.languageId} ${documentUri}`);
            //
            // Add the new document data to the documents map
            //
            documentModel    = new DocumentModel(document);
            this.documents  .set(documentUri, documentModel);

            return documentModel;
        }

        //#1 Document version must match, otherwise the document has been changed
        if(documentModel.version !== document.version) {
            log.debug(`[${FILE}] DocumentMap::upsert() CHANGED v${documentModel.version} -> v${document.version} ${documentUri}`);
            //
            // Replace the document data in the documents map
            //
            documentModel    = new DocumentModel(document);
            this.documents  .set(documentUri, documentModel);

            return documentModel;
        }
        
        //#1 Document data found for the same version (document has not changed)
        log.debug(`[${FILE}] DocumentMap::upsert() FOUND v${document.version} ${document.languageId} ${documentUri}`);
        return documentModel;

    }
    //#) upsert()

    //#( docUri() -- Creates document URI.
    //-( --------------------------------------------------------------------------------
    private docUri(document: vscode.TextDocument): string
    {
        return document.uri.scheme + '://' + document.uri.fsPath;
    }
    //#) docUri()

} 
//#*} DocumentMap

//#{ documentMap -- Singleton instance of the DocumentMap class.
//-{ -----------------------------------------------------------------------------------

export let documentMap:DocumentMap = new DocumentMap();
//#} documentMap
