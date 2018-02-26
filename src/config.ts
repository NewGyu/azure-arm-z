import { IsString, IsNotEmpty, ValidateNested, IsDefined } from "class-validator";
import { transformAndValidateSync } from "class-transformer-validator";
import { Logger, DefaultLogger } from "./logger";

export class ResourceGroup {
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsNotEmpty()
  @IsString()
  location: string;
  tags?: { [propertyName: string]: string };
}

export class ZConfig {
  @ValidateNested()
  @IsDefined()
  resourceGroup: ResourceGroup;
  @IsString() subscliptionId?: string;

  parameters?: object;
  logger?: Logger;
  [opts: string]: any;
}

const defaultConfig = {
  logger: DefaultLogger
};

export function create(val: object): ZConfig {
  const newVal: object = Object.assign({}, defaultConfig, val);
  try {
    const newConfig = transformAndValidateSync(ZConfig, newVal);
    return newConfig;
  } catch (err) {
    throw formatError(err);
  }
}

function formatError(err: any[]) {
  const details = err.map(e => Object.values(e.constraints)).reduce((sum, curr) => sum.concat(curr), []);
  return new Error(["config is invalid", ...details.map(d => " - " + d)].join("\n"));
}
