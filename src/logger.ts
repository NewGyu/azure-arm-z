export interface Logger {
  trace(msg?: string, ...addtional: any[]): void;
  debug(msg?: string, ...addtional: any[]): void;
  info(msg?: string, ...addtional: any[]): void;
  warn(msg?: string, ...addtional: any[]): void;
  error(msg?: string, ...addtional: any[]): void;
  fatal(msg?: string, ...addtional: any[]): void;
}

export const DefaultLogger = new class implements Logger {
  trace(msg?: string, ...addtional: any[]): void {}
  debug(msg?: string, ...addtional: any[]): void {
    console.log(msg, ...addtional);
  }
  info(msg?: string, ...addtional: any[]): void {
    console.log(msg, ...addtional);
  }
  warn(msg?: string, ...addtional: any[]): void {
    console.error(msg, ...addtional);
  }
  error(msg?: string, ...addtional: any[]): void {
    console.error(msg, ...addtional);
  }
  fatal(msg?: any, ...addtional: any[]): void {
    console.error(msg, addtional);
  }
}();
