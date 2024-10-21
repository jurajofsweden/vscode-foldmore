const packageJson = require("../package.json");

export class Config
{
    public static readonly extensionName        = packageJson.displayName;
    public static readonly extensionId          = packageJson.name;
    public static readonly extensionVersion     = packageJson.version;
    public static readonly supportedLanguages   = packageJson.activationEvents.map((ae: string) => ae.split(":")[1]);
    public static readonly configName           = "foldmore";
    public static readonly sectionStyles        = "styles";
}

