//#< Imports and constants
import * as path 			from 'path';
import * as fs 				from 'fs';
import * as vscode 			from 'vscode';
import { Config } 			from './config';
import { documentMap }		from './document-map';
import { log } 				from './log';

const FILE = path.basename(__filename);
//#> Imports and constants

//#{* StyledIcon
//-{* --------------------------------------------------------------------------------------------
export class StyledIcon
{
	constructor(	readonly colorDark	:string,
					readonly dirDark	:string,
					readonly fileDark	:string,
					readonly colorLight	:string,
					readonly dirLight	:string,
					readonly fileLight	:string
	) {}
}
//#*} StyledIcon

//#{* StyledIconForMarker -- Styled icons for markers
//-{* --------------------------------------------------------------------------------------------
export class StyledIconForMarker
{
	//#{ defaultIcon -- used when no icon is defined for a marker
	//-{ -----------------------------------------------------------------------------------------
	private static defaultIcon :StyledIcon 	= new StyledIcon(
		"white", path.join(__filename, '..', '..', "resources/icons/dark"),  "default-icon.svg",
		"black", path.join(__filename, '..', '..', "resources/icons/light"), "default-icon.svg"
		);
	//#} defaultIcon
	
	//#{ styles2icons -- icon styles for all markers
	//-{ --------------------------------------------------------------------------------------------
	/* eslint-disable @typescript-eslint/naming-convention */
	private static styles2icons :any = {
		"fold-data-type-label": {
			marker: "{*",
			icon: {
				dir: "resources/icons",
				file: "data-type.svg"
			}
		},
		"fold-object-label": {
			marker: "{",
			icon: {
				dir: "resources/google-fonts",
				file: "data_object_FILL0_wght400_GRAD200_opsz48.svg"
			}
		},
		"fold-array-label": {
			marker: "[",
			icon: {
				dir: "resources/google-fonts",
				file: "data_array_FILL0_wght400_GRAD200_opsz48.svg"
			}
		},
		"fold-function-label": {
			marker: "(",
			icon: {
				dir: "resources/icons",
				file: "function.svg"
			}
		},
		"fold-section-label": {
			marker: "<",
			icon: {
				dir: "resources/google-fonts",
				file: "code_FILL0_wght400_GRAD200_opsz48.svg"
			}
		},
		"fold-region-label": {
			marker: "region",
			icon: {
				dir: "resources/google-fonts",
				file: "code_FILL0_wght400_GRAD200_opsz48.svg"
			}
		},
		"headline-level-1": {
			marker: "1",
			icon: {
				dir: "resources/google-fonts",
				file: "chat_bubble_FILL0_wght400_GRAD200_opsz48.svg"
			}
		},
		"headline-level-2": {
			marker: "2",
			icon: {
				dir: "resources/google-fonts",
				file: "chat_bubble_FILL0_wght400_GRAD200_opsz48.svg"
			}
		},
		"headline-level-3": {
			marker: "3",
			icon: {
				dir: "resources/google-fonts",
				file: "chat_bubble_FILL0_wght400_GRAD200_opsz48.svg"
			}
		}
	}; // styles2icons
	/* eslint-enable @typescript-eslint/naming-convention */
	//#} styles2icons

	//#{ styledIcons -- static map of styled icons for markers
	//-{ --------------------------------------------------------------------------------------------
	private static styledIcons :Map<string, StyledIcon> = new Map<string, StyledIcon>();
	//#} styledIcons

	//#( getIcon ( marker ) -- Get styled icon for a marker
	//-( -----------------------------------------------------------------------------------------
	public static getIcon(marker: string): StyledIcon
	{
		return this.styledIcons.get(marker) || this.defaultIcon;
	}
	//#) getIcon ( marker )

	//#( prepareStyledIcon ( dir, file, decorations ) -- Prepare styled icon
	//-( --------------------------------------------------------------------------------------------
	//   Patterns for changing fill and stroke colors in SVG files
	private static svgFillColorRegEx 	= /fill="#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|\b[a-zA-Z]+)\b"/g;
	private static svgStrokeColorRegEx 	= /stroke="#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|\b[a-zA-Z]+)\b"/g;
	
	private static prepareStyledIcon(dir:string, file:string, decorations:any) :StyledIcon
	{
		const darkColor  = decorations.dark  ? decorations.dark.color  : "white";
		const lightColor = decorations.light ? decorations.light.color : "black";

		const styledDarkIconName 	= `${path.basename(file)}_${darkColor}.svg`;
		const styledLightIconName 	= `${path.basename(file)}_${lightColor}.svg`;

		const templateIconPath 		= path.join(__filename, '..', '..', dir, file);
		const styledDarkIconPath 	= path.join(__filename, '..', '..', dir, 'dark');
		const styledLightIconPath 	= path.join(__filename, '..', '..', dir, 'light');

		log.debug(`[${FILE}] StyledIconForMarker::prepareStyledIcon() templateIcon: ${templateIconPath} darkIcon: ${styledDarkIconPath}/${styledDarkIconName}, lightIcon: ${styledLightIconPath}/${styledLightIconName}`);

		const templateIconSVG = fs.readFileSync(templateIconPath, 'utf-8');

		const darkStyledSVG  	= templateIconSVG	
								.replace(this.svgFillColorRegEx,   	`fill="${darkColor}"`)
								.replace(this.svgStrokeColorRegEx, 	`stroke="${darkColor}"`);
		const lightStyledSVG 	= templateIconSVG
								.replace(this.svgFillColorRegEx, 	`fill="${lightColor}"`)
								.replace(this.svgStrokeColorRegEx,  `stroke="${lightColor}"`);

		fs.writeFileSync(path.join(styledDarkIconPath,  styledDarkIconName),  darkStyledSVG);
		fs.writeFileSync(path.join(styledLightIconPath, styledLightIconName), lightStyledSVG);

		return new StyledIcon(
				darkColor,  styledDarkIconPath,  styledDarkIconName,
				lightColor, styledLightIconPath, styledLightIconName
			);
	} 
	//#) prepareStyledIcon( dir, file, decorations )

	//#( static constructor
	//-( --------------------------------------------------------------------------------------------
	static {
		log.trace(`[${FILE}] StyledIconForMarker::static constructor()`);

		this.applyStyles();

		vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
			if (e.affectsConfiguration(Config.configName)) {
				this.applyStyles();
			}
		});	

	} 
	//#) static constructor

	//#( applyStyles() -- Apply styles from the configuration (extension settings)
	//-( --------------------------------------------------------------------------------------------
	private static applyStyles()
	{
		let styles:any = vscode.workspace.getConfiguration(Config.configName).get(Config.sectionStyles);

		//#1 Apply styles if defined in the configuration
		if(styles) {

			log.info(`Extension "${Config.extensionName}" version ${Config.extensionVersion} Loading icon styles from "${Config.configName}.${Config.sectionStyles}".`);

			for(let style of styles) {

				if(style.style && style.decorations) {

					log.debug(`[${FILE}] StyledIconForMarker::applyStyles() "${style.style}": ${JSON.stringify(style.decorations)}`);

					switch(style.style) {

						case "comment-marker":
							break;

						case "fold-data-type-label":
						case "fold-object-label":
						case "fold-array-label":
						case "fold-function-label":
						case "fold-section-label":
						case "headline-level-1":
						case "headline-level-2":
						case "headline-level-3":
							const styledIcon = this.prepareStyledIcon(
													this.styles2icons[style.style].icon.dir, 
													this.styles2icons[style.style].icon.file,
													style.decorations
											);	
							this.styledIcons.set(this.styles2icons[style.style].marker, styledIcon);
							log.info(`   Icon colors for marker "${this.styles2icons[style.style].marker}" loaded from style "${style.style}": Dark: "${styledIcon.colorDark}" Light: "${styledIcon.colorLight}".`);
							log.debug(`	    Template icon     : "${this.styles2icons[style.style].icon.dir}/${this.styles2icons[style.style].icon.file}".`);
							log.debug(`	    Dark styled icon  : "${styledIcon.dirDark}/${styledIcon.fileDark}".`);
							log.debug(`	    Light styled icon : "${styledIcon.dirLight}/${styledIcon.fileLight}".`);

							if(style.style === "fold-section-label") {
								this.styledIcons.set("region", styledIcon);
								log.info(`   Icon colors for marker "region" loaded from style "${style.style}": Dark: "${styledIcon.colorDark}" Light: "${styledIcon.colorLight}".`);
							}
							break;

						default:
							//log.warn(`Extension "${Config.extensionName}" version ${Config.extensionVersion} Style "${style.style}" not applicable for icons.`);
							break;
					} // switch

				} // if style with decorations
			} // for each style
		} // if styles

		//#1 Refresh syntax highlighting in open documents by clearing the document map
		documentMap?.clear();

	} // if(styles)
	//#) applyStyles()

} 
//#*} StyledIconForMarker

