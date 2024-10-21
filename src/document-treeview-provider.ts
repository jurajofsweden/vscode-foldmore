//#< Imports and constants
import * as vscode              from 'vscode';
import * as path                from 'path';
import { log }                  from './log';
import { documentSignature }    from './document-signature';
import { StyledIcon,
         StyledIconForMarker
       }                        from './document-treeview-icons';

const FILE = path.basename(__filename);
//#> Imports and constants

//#{* DocumentTreeModel -- Model for the navigation tree view
//-{ --------------------------------------------------------------------------------------------
export class DocumentTreeModel
{
    public  root              : TreeNode = new TreeNode(0, "root", "root", "", StyledIconForMarker.getIcon("region"));
    private currentNode       : TreeNode = this.root;
    private documentSignature : string   = "underfined";

    //#( constructor
    constructor(public readonly document: vscode.TextDocument)
    {
        log.trace(`[${FILE}] DocumentTreeModel::constructor() ${document.languageId} ${document.uri.scheme} v${document.version} ${path.basename(document.uri.fsPath)}`);
        this.documentSignature = documentSignature(document);
    }
    //#) constructor

    //#( isMatchRegionMarkers() -- Check if the start and end markers match
    public isMatchRegionMarkers(startMarker:string, endMarker:string):boolean
    {
        return (startMarker === "{*"     && endMarker === "*}") ||
               (startMarker === "{"      && endMarker === "}")  ||
               (startMarker === "["      && endMarker === "]")  ||
               (startMarker === "("      && endMarker === ")")  ||
               (startMarker === "<"      && endMarker === ">")  ||
               (startMarker === "region" && endMarker === "endregion");
    } 
    //#) isMatchRegionMarkers()

    //#( update() -- Update the tree model based on a new line with a marker
    public update(
        line:               string,
        lineNumber:         number,
        marker:             string,
        label:              string,
        freetext:           string
        ): void
    {
        log.trace(`[${FILE}] DocumentTreeModel::update() line ${lineNumber} marker: ${marker} label: ${label} freetext: ${freetext}`);

        switch(marker) {

            //-1 ------------------------------------------------------------------------------------------------
            //#1 Headline markers
            //-1 ------------------------------------------------------------------------------------------------
            case "1":
            case "2":
            case "3":{
                //
                // Walk up the tree until we find a header one level up, a region or a root
                //
                let parentNode:TreeNode|undefined;
                let markerLevel = +marker|NaN;
                while( (this.currentNode.marker !== "root") && (parentNode = this.currentNode.getParent()) )
                {
                    const currentNodeLevel = +this.currentNode.marker|NaN;
                    if(currentNodeLevel && (currentNodeLevel > 0) && (currentNodeLevel >= markerLevel)) {
                        this.currentNode = parentNode;
                        continue; // while
                    }

                    // this should be region or root
                    break; // while

                } // while

                const newNode:TreeNode = new TreeNode(lineNumber, marker, label, freetext, StyledIconForMarker.getIcon(marker));
                this.currentNode.pushChild(newNode);
                this.currentNode = newNode;

                }break;

            //-1 ------------------------------------------------------------------------------------------------
            //#1 Region start-markers
            //-1 ------------------------------------------------------------------------------------------------
            case '{*':
            case '{':
            case '[':
            case '(':
            case '<':
            case 'region':{
                //
                // Walk up the tree skipping all headlines to the nearest region or the root
                //
                let parentNode:TreeNode|undefined;

                while( (this.currentNode.marker !== "root") && (parentNode = this.currentNode.getParent()) )
                {
                    const currentNodeLevel = +this.currentNode.marker|NaN;
                    if(currentNodeLevel) {
                        this.currentNode = parentNode;
                        continue; // while
                    }

                    // this should be region or root
                    break; // while

                } // while

                const newNode:TreeNode = new TreeNode(lineNumber, marker, label, freetext, StyledIconForMarker.getIcon(marker));
                this.currentNode.pushChild(newNode);
                this.currentNode = newNode;

                }break;

            //-1 ------------------------------------------------------------------------------------------------
            //#1 Region end-markers
            //-1 ------------------------------------------------------------------------------------------------
            case '*}':
            case '}':
            case ']':
            case ')':
            case '>':
            case 'endregion':{
                //
                // Walk up the tree skipping all headlines and closing the nearest region higher up in the tree.
                // The region end-markers must match the region start-markers. Skip all non-matching markers.
                //
                let parentNode:TreeNode|undefined;

                while( (this.currentNode.marker !== "root") && (parentNode = this.currentNode.getParent()) )
                {
                    const currentNodeLevel = +this.currentNode.marker|NaN;
                    if(currentNodeLevel) {
                        this.currentNode = parentNode;
                        continue; // while
                    }

                    //
                    // Close the nearest region higher up in the tree, if the start and end markers match
                    //
                    if(this.isMatchRegionMarkers(this.currentNode.marker, marker)) {
                        this.currentNode = parentNode;
                        // Stop climbing up the tree
                        break; // while
                    }

                    // this should be root
                    break; // while

                } // while
                }break;

        } // switch(marker)

    } 
    //#) update()

}
//#*} DocumentTreeModel

//#{* TreeNode -- Tree node for the navigation tree view
//-{* --------------------------------------------------------------------------------------------
class   TreeNode 
extends vscode.TreeItem // https://code.visualstudio.com/api/references/vscode-api#TreeItem
{
    private         parent            : TreeNode|undefined              = undefined;
    private         children          : TreeNode[]                      = [];
    public          collapsibleState  : vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None;

    constructor(
      public readonly lineNumber        : number,     // 0, 1, 2, ...
      public readonly marker            : string,
      public readonly label_            : string,
      public readonly freetext          : string,
      public readonly icon              : StyledIcon
    )
    {
      super(label_ + (freetext ? " -- " + freetext : ""), vscode.TreeItemCollapsibleState.None);

      this.icon     = icon;

      this.command  = {
        command: "foldmore.jumpToLine",
        title:   "Jump to line",
        arguments: [this.lineNumber]
      };

      this.iconPath = {
        light: path.join(icon.dirLight, icon.fileLight),
        dark:  path.join(icon.dirDark,  icon.fileDark)
      };

      log.debug(`[${FILE}] TreeNode::constructor() line: ${this.lineNumber} marker: ${this.marker} label: ${this.label} freetext: ${this.freetext} icon.light: ${this.iconPath.light} icon.dark: ${this.iconPath.dark}`);

    } // constructor

     public getChildren():TreeNode[]
     {
        return this.children;
     } // getChildren()

     public getLastChild():TreeNode|undefined
     {
        return this.children.length > 0 ? this.children[this.children.length-1] : undefined;
     } // getLastChild()

     public getParent():TreeNode|undefined
     {
        return this.parent;
     } // getParent()

     
     public pushChild(childNode:TreeNode)
     {
        childNode.parent = this;
        this.children.push(childNode);
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
     } // pushChild()

} 
//#*} TreeNode

//#{* DocumentTreeViewProvider -- Provider for the navigation tree view
//-{* --------------------------------------------------------------------------------------------
export  class       DocumentTreeViewProvider 
        implements  vscode.TreeDataProvider<TreeNode>   // https://code.visualstudio.com/api/references/vscode-api#TreeDataProvider&lt;T&gt;
{
    private         documentTreeModel    : DocumentTreeModel            | undefined         = undefined;

    private         _onDidChangeTreeData : vscode.EventEmitter<TreeNode | undefined | void> = new vscode.EventEmitter<TreeNode | undefined | void>();
	readonly        onDidChangeTreeData  : vscode.Event<TreeNode        | undefined | void> = this._onDidChangeTreeData.event;
    
    private static  jumpToLineCommand    : vscode.Disposable            | undefined         = undefined;

    constructor(private readonly context: vscode.ExtensionContext) 
    {
        if(!DocumentTreeViewProvider.jumpToLineCommand) {
            DocumentTreeViewProvider.jumpToLineCommand = vscode.commands.registerCommand("foldmore.jumpToLine", (lineNumber) => {
                vscode.window.activeTextEditor?.revealRange(
                  new vscode.Range(lineNumber, 0, lineNumber, 0), vscode.TextEditorRevealType.AtTop
                );
            });
        }
    } // constructor()

    public setDocumentTreeModel(documentTreeModel:DocumentTreeModel):void
    {
        this.documentTreeModel = documentTreeModel;
        this._onDidChangeTreeData.fire();
    } // setDocumentTreeModel()

    getChildren(element?: TreeNode): TreeNode[] 
    {
        if ( ! element) {
            return this.documentTreeModel ? this.documentTreeModel.root.getChildren() : [];
        }
        return element.getChildren();
    }

    getTreeItem(element: TreeNode): vscode.TreeItem {
        return element;
    }

}
//#*} DocumentTreeViewProvider
