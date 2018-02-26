import { ZConfig } from "./config";
import { Logger } from "./logger";
import { ServiceClientCredentials } from "ms-rest";
import { ResourceManagementClient } from "azure-arm-resource";
import * as moment from "moment";

interface Deployment {
  resourceGroupName: string;
  name: string;
  properties: {
    template: any;
    parameters?: any;
    mode: "Complete";
  };
}

export class Deployer {
  private rmClient: ResourceManagementClient;
  private logger: Logger;

  constructor(private config: ZConfig.ZConfig, credentials: ServiceClientCredentials, subscriptionId: string) {
    this.rmClient = new ResourceManagementClient(credentials, subscriptionId);
    this.logger = config.logger as Logger;
  }

  async deploy(template: object) {
    const deployment = this._createDeploymentObj(template);
    await this._createOrUpdateResourceGroup();
    await this._validate(deployment);
    await this.rmClient.deployments.createOrUpdate(deployment.resourceGroupName, deployment.name, deployment);
  }

  async validate(template: object) {
    const deployment = this._createDeploymentObj(template);
    await this._createOrUpdateResourceGroup();
    await this._validate(deployment);
  }

  async destroy() {
    const resourceGroupName = this.config.resourceGroup.name;
    const exists = await this.rmClient.resourceGroups.checkExistence(resourceGroupName);
    if (!exists) throw new Error(`ResourceGroup [${resourceGroupName}] is not exists.`);
    await this.rmClient.resourceGroups.deleteMethod(resourceGroupName);
  }

  private _createDeploymentObj(template: object): Deployment {
    const resourceGroupName = this.config.resourceGroup.name;
    const timestamp = moment().format("YYYYMMDDTHHmmssSSS");
    return {
      resourceGroupName: resourceGroupName,
      name: `${resourceGroupName}_${timestamp}`,
      properties: {
        mode: "Complete",
        template: template,
        parameters: this.config.parameters
      }
    };
  }

  private async _createOrUpdateResourceGroup() {
    const resourceGroup = this.config.resourceGroup;
    const exists = await this.rmClient.resourceGroups.checkExistence(resourceGroup.name);

    const rgParams = {
      location: resourceGroup.location,
      tags: resourceGroup.tags
    };
    await this.rmClient.resourceGroups.createOrUpdate(resourceGroup.name, rgParams);
    this.logger.info(`ResourceGroup [${resourceGroup.name}] is ${exists ? "updated" : "created"}.`);
  }

  private async _validate(deployment: Deployment) {
    const resourceGroupName = this.config.resourceGroup.name;
    const r = await this.rmClient.deployments.validate(resourceGroupName, deployment.name, deployment);
    const err = r.error;
    if (err) {
      throw new Error(JSON.stringify(err, null, 2));
    }
  }
}
