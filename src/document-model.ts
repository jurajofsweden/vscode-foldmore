import * as vscode 		                from 'vscode';
import * as path                        from 'path';
import { DocumentTreeModel }            from './document-treeview-provider';
import { DecoratorStyles }              from './document-decorator-styles';
import { log } 						    from './log';

const FILE = path.basename(__filename);

//#{* DocumentDecoration -- Represents a decoration style for a cocument.
//-{* -----------------------------------------------------------------------------------
export class DocumentDecoration
{
    constructor( public readonly style   : vscode.TextEditorDecorationType,
                 public readonly options : vscode.DecorationOptions[])
    {}
} 
//#*} DocumentDecoration

//#{* FoldRegionStart -- Represents the start of a fold region.
//-{* -----------------------------------------------------------------------------------
class FoldRegionStart {
    public  startLine:  number;
    public  marker:     string;
    public  label:      string;

    constructor(startLine: number, marker: string, label: string) 
    {
        this.startLine  = startLine;
        this.marker     = marker;
        this.label      = label;
    } // constructor()

} 
//#*} FoldRegionStart

//#{* DocumentModel -- Represents an open document in the workspace.
//-{* -----------------------------------------------------------------------------------
export class DocumentModel
{
    public readonly document    : vscode.TextDocument;
    public readonly scheme      : string;
    public readonly fsPath      : string;
    public readonly version     : number;
    public          isParsed    : boolean                           = false;
    public          foldRegions : vscode.FoldingRange[]|undefined   = undefined;
    public          decorations : DocumentDecoration[]              = [];
    public          treeModel   : DocumentTreeModel|undefined       = undefined;   

    //#( constructor()
    //-( --------------------------------------------------------------------------------
    public constructor(document: vscode.TextDocument)
    {
        this.document   = document;
        this.scheme     = document.uri.scheme;
        this.fsPath     = document.uri.fsPath;
        this.version    = document.version;       
    } 
    //#) constructor()

    //#( parseDocument() -- Parses the document.
    //-( --------------------------------------------------------------------------------
    //   1. Parses the document for folding regions, headlines and comments in marker colors.
    //   2. Creates the tree model for the document.
    //   3. Creates the syntax highlighting decorations for the document.
    public parseDocument()
    {
        log.trace(`[${FILE}] DocumentModel::parseDocument() Begin: ${this.document.languageId} ${this.scheme} v${this.version} ${path.basename(this.fsPath)}`);

        let foldRegionsStarts               : FoldRegionStart[]          = [];
        let foldRegions                     : vscode.FoldingRange[]      = [];
    
        let commentMarkerDecoratons         : vscode.DecorationOptions[] = [];
        let headlineLevel1Decorations       : vscode.DecorationOptions[] = [];
        let headlineLevel2Decorations       : vscode.DecorationOptions[] = [];
        let headlineLevel3Decorations       : vscode.DecorationOptions[] = [];
        let foldDataTypeLabelDecorations    : vscode.DecorationOptions[] = [];
        let foldDataTypeFreeTextDecorations : vscode.DecorationOptions[] = [];
        let foldObjectLabelDecorations      : vscode.DecorationOptions[] = [];
        let foldObjectFreeTextDecorations   : vscode.DecorationOptions[] = [];
        let foldArrayLabelDecorations       : vscode.DecorationOptions[] = [];
        let foldArrayFreeTextDecorations    : vscode.DecorationOptions[] = [];
        let foldFunctionLabelDecorations    : vscode.DecorationOptions[] = [];
        let foldFunctionFreeTextDecorations : vscode.DecorationOptions[] = [];
        let foldSectionLabelDecorations     : vscode.DecorationOptions[] = [];
        let foldSectionFreeTextDecorations  : vscode.DecorationOptions[] = [];
    
        let documentTreeModel               : DocumentTreeModel = new DocumentTreeModel(this.document);
    
        //#< Parse the document line by line
        //-< -----------------------------------------------------------------------------------
        this.document
            .getText()
            .split(/\r?\n/g)
            .forEach((line, index) => {

            let match = line.match(/(^\s*\/\/\s*#\s*)(\{\*|\*\}|[\(\){}\[\]<>123])\s*(.*)$/);
    
            if (match) {
                const comment            = match[1];
                const marker             = match[2];
                const label_and_freetext = match[3].split("--");
                const label              = label_and_freetext[0].trim();
                const freetext           = label_and_freetext[1] ? label_and_freetext[1].trim() : "";
              //const sourceLine = index + 1;

                log.debug(`[${FILE}] DocumentModel::parseDocument() line ${index} marker: ${marker} label: ${label} freetext: ${freetext}`);

                //#< Folding Regions -- create the tree view of the document
                //-< -----------------------------------------------------------------------------------
                switch(marker) {
                    //#1 Start markers are just pushed to the top of the stack.
                    case "{*":
                    case "{":
                    case "(":
                    case "[":
                    case "<":
                        foldRegionsStarts.push(new FoldRegionStart(index, marker, label));
                        break;

                    //#1 The end marker must match the start marker, otherwise it's just ingored.
                    case "*}":
                    case "}":
                    case ")":
                    case "]":
                    case ">":
                        if(!foldRegionsStarts.length) {
                            // No start marker.
                            break; // switch(marker)
                        }
                        
                        let lastFoldRegionStart = foldRegionsStarts.pop();

                        if(lastFoldRegionStart) {
                            if( (lastFoldRegionStart.marker === "{*" && marker === "*}") ||
                                (lastFoldRegionStart.marker === "{"  && marker === "}")  ||
                                (lastFoldRegionStart.marker === "("  && marker === ")")  ||
                                (lastFoldRegionStart.marker === "["  && marker === "]")  ||
                                (lastFoldRegionStart.marker === "<"  && marker === ">") ) {
                                foldRegions.push(new vscode.FoldingRange(lastFoldRegionStart.startLine, index, vscode.FoldingRangeKind.Region));
                                break; // switch(marker)
                            }

                            // No matching start marker: push the start marker back to the stack.
                            foldRegionsStarts.push(lastFoldRegionStart);

                            break; // switch(marker)
                        } // if(lastFoldRegionStart)
            
                } // switch(marker)

                //#1 Update the tree model
                documentTreeModel.update(line, index, marker, label, freetext);

                //#> Folding Regions

                //#< Syntax highlighting -- for regions and headlines
                //-< -----------------------------------------------------------------------------------
                switch(marker) {
                    case "{*":
                    case "*}":
                        this.addDecorationRangesForLine(line, index, comment, marker, label, freetext, commentMarkerDecoratons, foldDataTypeLabelDecorations, foldDataTypeFreeTextDecorations);
                        break;
                    case "{":
                    case "}":
                        this.addDecorationRangesForLine(line, index, comment, marker, label, freetext, commentMarkerDecoratons, foldObjectLabelDecorations, foldObjectFreeTextDecorations);
                        break;
                    case "(":
                    case ")":
                        this.addDecorationRangesForLine(line, index, comment, marker, label, freetext, commentMarkerDecoratons, foldFunctionLabelDecorations, foldFunctionFreeTextDecorations);
                        break;
                    case "[":
                    case "]":
                        this.addDecorationRangesForLine(line, index, comment, marker, label, freetext, commentMarkerDecoratons, foldArrayLabelDecorations, foldArrayFreeTextDecorations);
                        break;
                    case "<":
                    case ">":
                        this.addDecorationRangesForLine(line, index, comment, marker, label, freetext, commentMarkerDecoratons, foldSectionLabelDecorations, foldSectionFreeTextDecorations);
                        break;
                    case "1":
                        this.addDecorationRangesForLine(line, index, comment, marker, null, null, commentMarkerDecoratons, headlineLevel1Decorations, null);
                        break;
                    case "2":
                        this.addDecorationRangesForLine(line, index, comment, marker, null, null, commentMarkerDecoratons, headlineLevel2Decorations, null);
                        break;
                    case "3":
                        this.addDecorationRangesForLine(line, index, comment, marker, null, null, commentMarkerDecoratons, headlineLevel3Decorations, null);
                        break;
                } // switch(marker)

                //#> Syntax highlighting
    
            } else {

                //#< Comments in marker colors
                //-< -----------------------------------------------------------------------------------
                match = line.match(/(^\s*\/\/\s*\-\s*)(\{\*|\*\}|[\(\){}\[\]<>123]|\{\*|\*\})\s*(.*)$/);

                if(match) {
                    const comment    = match[1];
                    const marker     = match[2];
                    const label      = match[3];

                    log.debug(`[${FILE}] DocumentModel::parseDocument() line ${index} marker: ${marker} label: ${label}`);

                    //
                    // Decorations
                    //
                    switch(marker) {
                        case "{*":
                        case "*}":
                            this.addDecorationRangesForLine(line, index, comment, marker, null, null, commentMarkerDecoratons, foldDataTypeLabelDecorations, null);
                            break;
                        case "{":
                        case "}":
                            this.addDecorationRangesForLine(line, index, comment, marker, null, null, commentMarkerDecoratons, foldObjectLabelDecorations, null);
                            break;
                        case "(":
                        case ")":
                            this.addDecorationRangesForLine(line, index, comment, marker, null, null, commentMarkerDecoratons,  foldFunctionLabelDecorations, null);
                            break;
                        case "[":
                        case "]":
                            this.addDecorationRangesForLine(line, index, comment, marker, null, null, commentMarkerDecoratons, foldArrayLabelDecorations, null);
                            break;
                        case "<":
                        case ">":
                            this.addDecorationRangesForLine(line, index, comment, marker, null, null, commentMarkerDecoratons, foldSectionLabelDecorations, null);
                            break;
                        case "1":
                            this.addDecorationRangesForLine(line, index, comment, marker, null, null, commentMarkerDecoratons, headlineLevel1Decorations, null);
                            break;
                        case "2":
                            this.addDecorationRangesForLine(line, index, comment, marker, null, null, commentMarkerDecoratons, headlineLevel2Decorations, null);
                            break;
                        case "3":
                            this.addDecorationRangesForLine(line, index, comment, marker, null, null, commentMarkerDecoratons, headlineLevel3Decorations, null);
                            break;
                    } // switch(marker)

                //#> Comments in marker colors
                
                } else {

                    //#< #region-#endregion -- special case for built in folding markers
                    //-< -----------------------------------------------------------------------------------
                    if(match = line.match(/^(\s*\/\/#)(region)\s*(.*)$/)) {
                        const comment            = match[1];
                        const marker             = match[2];
                        const label_and_freetext = match[3].split("--");
                        const label              = label_and_freetext[0].trim();
                        const freetext           = label_and_freetext[1] ? label_and_freetext[1].trim() : "";
                        //
                        // Decorations
                        //
                        this.addDecorationRangesForLine(line, index, comment, marker, label, freetext, commentMarkerDecoratons, foldSectionLabelDecorations, foldSectionFreeTextDecorations);
                        //
                        // Update the tree model
                        //
                        documentTreeModel.update(line, index, marker, label, freetext);

                    } else if(match = line.match(/^(\s*\/\/#)(endregion)\s*(.*)$/)) {
                        const comment            = match[1];
                        const marker             = match[2];
                        const label_and_freetext = match[3].split("--");
                        const label              = label_and_freetext[0].trim();
                        const freetext           = label_and_freetext[1] ? label_and_freetext[1].trim() : "";
                        //
                        // Decorations
                        //
                        this.addDecorationRangesForLine(line, index, comment, marker, label, freetext, commentMarkerDecoratons, foldSectionLabelDecorations, foldSectionFreeTextDecorations);
                        //
                        // Update the tree model
                        //
                        documentTreeModel.update(line, index, marker, label, freetext);
                    }
                    //#> #region-#endregion
                } // if-else match on Comments in marker colors or region/endregion

            } // if-else match on Folding & Headlines or Comments in marker colors

            //#1 Apply syntax highlighting
    
            this.decorations.push(new DocumentDecoration(DecoratorStyles.commentMarkerStyle,        commentMarkerDecoratons));
            this.decorations.push(new DocumentDecoration(DecoratorStyles.headlineLevel1Style,       headlineLevel1Decorations));
            this.decorations.push(new DocumentDecoration(DecoratorStyles.headlineLevel2Style,       headlineLevel2Decorations));
            this.decorations.push(new DocumentDecoration(DecoratorStyles.headlineLevel3Style,       headlineLevel3Decorations));
            this.decorations.push(new DocumentDecoration(DecoratorStyles.foldDataTypeLabelStyle,    foldDataTypeLabelDecorations));
            this.decorations.push(new DocumentDecoration(DecoratorStyles.foldDataTypeFreeTextStyle, foldDataTypeFreeTextDecorations));
            this.decorations.push(new DocumentDecoration(DecoratorStyles.foldObjectLabelStyle,      foldObjectLabelDecorations));
            this.decorations.push(new DocumentDecoration(DecoratorStyles.foldObjectFreeTextStyle,   foldObjectFreeTextDecorations));
            this.decorations.push(new DocumentDecoration(DecoratorStyles.foldArrayLabelStyle,       foldArrayLabelDecorations));
            this.decorations.push(new DocumentDecoration(DecoratorStyles.foldArrayFreeTextStyle,    foldArrayFreeTextDecorations));
            this.decorations.push(new DocumentDecoration(DecoratorStyles.foldFunctionLabelStyle,    foldFunctionLabelDecorations));
            this.decorations.push(new DocumentDecoration(DecoratorStyles.foldFunctionFreeTextStyle, foldFunctionFreeTextDecorations));
            this.decorations.push(new DocumentDecoration(DecoratorStyles.foldSectionLabelStyle,     foldSectionLabelDecorations));
            this.decorations.push(new DocumentDecoration(DecoratorStyles.foldSectionFreeTextStyle,  foldSectionFreeTextDecorations));
    
        }); // this.document forEach(line)

        //#> Parse the document line by line

        //#1 Update the document model
    
        this.foldRegions    = foldRegions;
        this.treeModel      = documentTreeModel;
        this.isParsed       = true;
    
        log.debug(`[${FILE}] DocumentModel::parseDocument() Done: ${this.document.languageId} ${this.scheme} v${this.version} ${path.basename(this.fsPath)}`);
    
    } 
    //#) parseDocument()

    //#( addDecorationRangesForLine() -- Helper function to add decoration ranges for a line.
    //-( --------------------------------------------------------------------------------
    private addDecorationRangesForLine(
        line:                   string,
        lineNumber:             number,
        comment:                string,
        marker:                 string,
        label:                  string|null,
        freetext:               string|null,
        markerDecorationList:   vscode.DecorationOptions[],
        labelDecorationList:    vscode.DecorationOptions[],
        freetextDecorationList: vscode.DecorationOptions[]|null)
    {
        const commentMarkerLength = comment.length + marker.length;

        markerDecorationList.push({ 
            range: new vscode.Range(new vscode.Position(lineNumber, 0), new vscode.Position(lineNumber, commentMarkerLength))
        });

        if(freetext) {

            const commentMarkerLabelLength = commentMarkerLength + (label ? label.length : 0);

            labelDecorationList.push({ 
                range: new vscode.Range(new vscode.Position(lineNumber, commentMarkerLength), new vscode.Position(lineNumber, commentMarkerLabelLength+1))
            });

            freetextDecorationList?.push({ 
                range: new vscode.Range(new vscode.Position(lineNumber, commentMarkerLabelLength+2), new vscode.Position(lineNumber, line.length))
            });

            return;
        } 

        labelDecorationList.push({ 
            range: new vscode.Range(new vscode.Position(lineNumber, commentMarkerLength), new vscode.Position(lineNumber, line.length))
        });
    
    } 
    //#) createDecorationsForLine()

} 
//#*} DocumentModel
