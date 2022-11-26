// credit: https://adrianhall.github.io/cloud/2019/06/30/building-an-efficient-logger-in-typescript/
// with some additional tweaks from Jeff Scott 11/24/2022

import { EventEmitter } from "events";

export class LogManager extends EventEmitter {

    private _options: LogOptions = {
        minLevels: {
            '': LogLevel.Info
        }
    };

    private _consoleLoggerRegistered = false;

    public configure(options: LogOptions): LogManager {
        this._options = Object.assign({}, this._options, options);
        return this;
    }

    public getLogger(module: string): Logger {
        let minLevel = LogLevel.None;
        let match = '';

        for (const key in this._options.minLevels) {
            if(module.startsWith(key) && key.length >= match.length) {
                minLevel = this._options.minLevels[key];
                match = key;
            }
        }

        return new Logger(this, module, minLevel);
    }

    public onLogEntry(listener: (logEntry: LogEntry) => void): LogManager {
        this.on(LogEvents.Log, listener);
        return this;
    }

    public registerConsoleLogger(): LogManager {
        if(this._consoleLoggerRegistered) { return this; }
        this.onLogEntry((entry) => {
            const msg = `[${entry.module}] ${LogLevel[entry.level]}: ${entry.message}`;
            switch (entry.level) {
                case LogLevel.Trace:
                    console.trace(msg);
                    break;
                case LogLevel.Debug:
                    console.debug(msg);
                    break;
                case LogLevel.Info:
                    console.info(msg);
                    break;
                case LogLevel.Warn:
                    console.warn(msg);
                    break;
                case LogLevel.Error:
                    console.error(msg);
                    break;
                default:
                    console.log(`${msg}`);
            }
        });
        this._consoleLoggerRegistered = true;
        return this;
    }
}

export interface LogEntry {
    level: LogLevel;
    module: string;
    message: string;
}

export interface LogOptions {
    minLevels: { [module: string]: LogLevel }
}

export class Logger {
    private _logManager: EventEmitter;
    private _minLevel: LogLevel;
    private _module: string;

    get minLogLevel(): LogLevel {
        return this._minLevel;
    }

    get isTraceSet(): boolean {
        return this._minLevel === LogLevel.Trace;
    }

    get isDebugSet(): boolean {
        return this._minLevel === LogLevel.Debug;
    }

    constructor(logManager: EventEmitter, module: string, minLevel: LogLevel) {
        this._logManager = logManager;
        this._minLevel = minLevel;
        this._module = module;
    }

    public log(logLevel: LogLevel, message: string): void {
        if(logLevel < this._minLevel) { return; }

        const logEntry: LogEntry = { level: logLevel, module: this._module, message };
        this._logManager.emit(LogEvents.Log, logEntry);
    }

    public trace(message: string): void { this.log(LogLevel.Trace, message); }
    public debug(message: string): void { this.log(LogLevel.Debug, message); }
    public info(message: string): void { this.log(LogLevel.Info, message); }
    public warn(message: string): void { this.log(LogLevel.Warn, message); }
    public error(message: string): void { this.log(LogLevel.Error, message); }

}

export enum LogLevel {
    None = 0,
    Trace = 1,
    Debug = 2,
    Info = 3,
    Warn = 4,
    Error = 5
}

export enum LogEvents {
    Log= 'log'
}

export const logging = new LogManager();