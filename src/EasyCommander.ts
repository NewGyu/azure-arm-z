import * as commander from "commander";
import { create, ZConfig } from "./config";
import { Deployer } from "./deployer";
import { ServiceClientCredentials } from "ms-rest";
import * as az from "ms-rest-azure";
import { Logger, DefaultLogger } from "./logger";

export class EasyCommander {
  private config: ZConfig;
  private logger: Logger;

  constructor(config: object, private template: object) {
    if (!config) throw new Error("config is required.");
    if (!template) throw new Error("template is required.");

    this.config = create(config);
    this.config.subscliptionId = process.env.AZURE_SUBSCRIPTION_ID || this.config.subscliptionId;
    this.logger = this.logger || DefaultLogger;

    this.initCommands();
  }

  private initCommands() {
    commander
      .command("deploy")
      .description(`create or update resource group [${this.config.resourceGroup.name}] to [${this.config.subscliptionId}]`)
      .action(() => {
        this._deploy()
          .then(this._finalizeHandler.bind(this))
          .catch(this._errorHandler.bind(this));
      });
    commander
      .command("validate")
      .description(`validate your template`)
      .action(() => {
        this._validate()
          .then(this._finalizeHandler.bind(this))
          .catch(this._errorHandler.bind(this));
      });
    commander
      .command("balus!")
      .description(`destroy resource group [${this.config.resourceGroup.name}] from [${this.config.subscliptionId}]`)
      .action(() => {
        this._destroy()
          .then(this._finalizeHandler.bind(this))
          .catch(this._errorHandler.bind(this));
      });
  }

  private async _deploy() {
    this.logger.info(JSON.stringify(this.template, null, 2));
    this.logger.info("deploy ...");
    const deployer = await this._createDeployer();
    await deployer.deploy(this.template);
    this.logger.info("deploy ... FINISHED.");
  }

  private async _validate() {
    this.logger.info(JSON.stringify(this.template, null, 2));
    this.logger.info("validate ...");
    const deployer = await this._createDeployer();
    await deployer.validate(this.template);
    this.logger.info("validation OK.");
  }

  private async _destroy() {
    this.logger.info("destroy ...");
    const deployer = await this._createDeployer();
    await deployer.destroy();
    this.logger.info("destroy ... FINISHED.");
  }

  private _finalizeHandler() {
    process.exit(0);
  }

  private _errorHandler(err: any) {
    console.error(err);
    process.exit(1);
  }

  exec(args: string[]) {
    //to display "help" when no args
    if (args.length < 3) args.push("--help");
    commander.parse(args);
  }

  private async _createDeployer() {
    const creds = await Auth.authenticate();
    if (!this.config.subscliptionId) throw new Error("env[AZURE_SUBSCRIPTION_ID] is required.");
    return new Deployer(this.config, creds, this.config.subscliptionId);
  }
}

namespace Auth {
  export enum AuthMode {
    Interactive = "interactiveLogin",
    AuthFile = "loginWithAuthFile"
  }

  export async function authenticate(params?: any): Promise<ServiceClientCredentials> {
    const mode = authMode();
    switch (mode) {
      case AuthMode.Interactive:
        return await az.interactiveLogin();
      case AuthMode.AuthFile:
        return await az.loginWithAuthFile();
      default:
        throw new Error(`[${mode}] is Unknown AutMode.`);
    }
  }

  function authMode(): AuthMode {
    const authFileLocation = process.env.AZURE_AUTH_LOCATION as string;
    if (authFileLocation) return AuthMode.AuthFile;
    return AuthMode.Interactive;
  }
}
