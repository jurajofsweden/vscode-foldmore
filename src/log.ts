import * as vscode  from 'vscode';
import { Config }   from './config';

//
//#1 Create a logger for the extension with the given extension name
//
export let log = vscode.window.createOutputChannel(Config.extensionName, {log: true});

//
//#1 Print the log level to the log output channel
//
log.info(`Log level: ${logLevelName(log.logLevel)}`);

//
//#1 Log when the log level changes
//
log.onDidChangeLogLevel(event => {
    log.info(`Log level changed to: ${logLevelName(event)}`);
});

//#( logLevelName(logLevel) -- Return the name of the given log level
//-( --------------------------------------------------------------------------------------------
export function logLevelName(logLevel:vscode.LogLevel): string 
{
    switch(logLevel) {
        case vscode.LogLevel.Error:   return 'Error';
        case vscode.LogLevel.Warning: return 'Warning';
        case vscode.LogLevel.Info:    return 'Info';
        case vscode.LogLevel.Debug:   return 'Debug';
        case vscode.LogLevel.Trace:   return 'Trace';
        default:                      return 'Unknown';
    }
}
//#) logLevelName(logLevel)


