import * as vscode 		from 'vscode';
import * as path 		from 'path';
import { Config } 		from './config';
import { log }			from './log';
import { documentMap }	from './document-map';

const FILE = path.basename(__filename);

//#{* DecoratorStyles -- Static class to manage syntax styles for the document decorator.
//-{* -----------------------------------------------------------------------------------
export class DecoratorStyles
{
	//#{ defaultStyle -- Default style for all decorations.
	//-{ --------------------------------------------------------------------------------
	private static defaultStyle: vscode.DecorationRenderOptions = {
		light: {
			color: 'black'
		},
		dark: {
			color: "white"
		}
	};
	//#} defaultStyle

	//#[ Styles -- Syntax styles for the document decorator.
	//-[ --------------------------------------------------------------------------------
	public static commentMarkerStyle 		= vscode.window.createTextEditorDecorationType(this.defaultStyle);
	public static headlineLevel1Style 		= vscode.window.createTextEditorDecorationType(this.defaultStyle);
	public static headlineLevel2Style 		= vscode.window.createTextEditorDecorationType(this.defaultStyle);
	public static headlineLevel3Style 		= vscode.window.createTextEditorDecorationType(this.defaultStyle);
	public static foldDataTypeLabelStyle 	= vscode.window.createTextEditorDecorationType(this.defaultStyle);
	public static foldDataTypeFreeTextStyle	= vscode.window.createTextEditorDecorationType(this.defaultStyle);
	public static foldObjectLabelStyle 		= vscode.window.createTextEditorDecorationType(this.defaultStyle);
	public static foldObjectFreeTextStyle 	= vscode.window.createTextEditorDecorationType(this.defaultStyle);
	public static foldArrayLabelStyle 		= vscode.window.createTextEditorDecorationType(this.defaultStyle);
	public static foldArrayFreeTextStyle 	= vscode.window.createTextEditorDecorationType(this.defaultStyle);
	public static foldFunctionLabelStyle 	= vscode.window.createTextEditorDecorationType(this.defaultStyle);
	public static foldFunctionFreeTextStyle = vscode.window.createTextEditorDecorationType(this.defaultStyle);
	public static foldSectionLabelStyle 	= vscode.window.createTextEditorDecorationType(this.defaultStyle);
	public static foldSectionFreeTextStyle 	= vscode.window.createTextEditorDecorationType(this.defaultStyle);
	//#] Styles

	//#( static constructor() -- Initialize the class.
	//-( --------------------------------------------------------------------------------
	static {
		log.trace(`[${FILE}] export class DecoratorStyles::static constructor()`);

		this.applyStyles();

		vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
			if (e.affectsConfiguration(Config.configName)) {
				this.applyStyles();
			}
		});	

	}
	//#) static constructor()

	//#( applyStyles() -- Apply  styles in extension settings to documents.
	//-( --------------------------------------------------------------------------------
	//   1. Load the syntax styles from the extension settings (configuration).
	//   2. Apply the styles to the documents by clearing the current document map.
	public static applyStyles()
	{
		log.trace(`[${FILE}] DecoratorStyles::applyStyles()`);

		let styles:any = vscode.workspace.getConfiguration(Config.configName).get(Config.sectionStyles);

		if(styles) {

			log.info(`Extension "${Config.extensionName}" version ${Config.extensionVersion} Loading syntax styles from "${Config.configName}.${Config.sectionStyles}".`);

			for(let style of styles) {

				if(style.style && style.decorations) {

					log.debug(`[${FILE}] DecoratorStyles::applyStyles() "${style.style}": ${JSON.stringify(style.decorations)}`);

					switch(style.style) {
						case "comment-marker":
							this.commentMarkerStyle.dispose();
							this.commentMarkerStyle = vscode.window.createTextEditorDecorationType(style.decorations);
							log.info(`   Syntax style "${style.style}" loaded.`);
							break;
						case "headline-level-1":
							this.headlineLevel1Style.dispose();
							this.headlineLevel1Style = vscode.window.createTextEditorDecorationType(style.decorations);
							log.info(`   Syntax style "${style.style}" loaded.`);
							break;
						case "headline-level-2":
							this.headlineLevel2Style.dispose();
							this.headlineLevel2Style = vscode.window.createTextEditorDecorationType(style.decorations);
							log.info(`   Syntax style "${style.style}" loaded.`);
							break;
						case "headline-level-3":
							this.headlineLevel3Style.dispose();
							this.headlineLevel3Style = vscode.window.createTextEditorDecorationType(style.decorations);
							log.info(`   Syntax style "${style.style}" loaded.`);
							break;
						case "fold-data-type-label":
							this.foldDataTypeLabelStyle.dispose();
							this.foldDataTypeLabelStyle = vscode.window.createTextEditorDecorationType(style.decorations);
							log.info(`   Syntax style "${style.style}" loaded.`);
							break;
						case "fold-data-type-freetext":
							this.foldDataTypeFreeTextStyle.dispose();
							this.foldDataTypeFreeTextStyle = vscode.window.createTextEditorDecorationType(style.decorations);
							log.info(`   Syntax style "${style.style}" loaded.`);
							break;
						case "fold-object-label":
							this.foldObjectLabelStyle.dispose();
							this.foldObjectLabelStyle = vscode.window.createTextEditorDecorationType(style.decorations);
							log.info(`   Syntax style "${style.style}" loaded.`);
							break;
						case "fold-object-freetext":
							this.foldObjectFreeTextStyle.dispose();
							this.foldObjectFreeTextStyle = vscode.window.createTextEditorDecorationType(style.decorations);
							log.info(`   Syntax style "${style.style}" loaded.`);
							break;
						case "fold-array-label":
							this.foldArrayLabelStyle.dispose();
							this.foldArrayLabelStyle = vscode.window.createTextEditorDecorationType(style.decorations);
							log.info(`   Syntax style "${style.style}" loaded.`);
							break;
						case "fold-array-freetext":
							this.foldArrayFreeTextStyle.dispose();
							this.foldArrayFreeTextStyle = vscode.window.createTextEditorDecorationType(style.decorations);
							log.info(`   Syntax style "${style.style}" loaded.`);
							break;
						case "fold-function-label":
							this.foldFunctionLabelStyle.dispose();
							this.foldFunctionLabelStyle = vscode.window.createTextEditorDecorationType(style.decorations);
							log.info(`   Syntax style "${style.style}" loaded.`);
							break;
						case "fold-function-freetext":
							this.foldFunctionFreeTextStyle.dispose();
							this.foldFunctionFreeTextStyle = vscode.window.createTextEditorDecorationType(style.decorations);
							log.info(`   Syntax style "${style.style}" loaded.`);
							break;
						case "fold-section-label":
							this.foldSectionLabelStyle.dispose();
							this.foldSectionLabelStyle = vscode.window.createTextEditorDecorationType(style.decorations);
							log.info(`   Syntax style "${style.style}" loaded.`);
							break;
						case "fold-section-freetext":
							this.foldSectionFreeTextStyle.dispose();
							this.foldSectionFreeTextStyle = vscode.window.createTextEditorDecorationType(style.decorations);
							log.info(`   Syntax style "${style.style}" loaded.`);
							break;
						default:
							log.warn(`Extension "${Config.extensionName}" version ${Config.extensionVersion} Style "${style.style}" not applicable for syntax.`);
							break;
					} // switch
				} // if
			} // for
		} else {
			log.warn(`Extension "${Config.extensionName}" version ${Config.extensionVersion} No styles found in configuration "${Config.configName}.${Config.sectionStyles}".`);
        } // if

		//
		// Clear the document map
		//
		documentMap?.clear();

	} 
	//#) applyStyles()

} 
//#*} DecoratorStyles
