/**
 * @file ABetterChoice.cc.d.ts
 * @author fitcher
 * @date 2024-09-09
 */
declare class ABetterChoice {
  static init(config: any): Promise<boolean>;
  static getExperiment(layerCode: string, isNeedReport?: boolean): any | undefined;
  static logExperimentExposure(expInfo: any): Promise<boolean>;
  static refreshExperiment(): Promise<boolean>;

  static getConfig(key: string): any | undefined;
  static getConfigByKeys(keys: string[]): Record<string, unknown>;
  static refreshFeatureFlag(): Promise<boolean>;
  static logFeatureFlagExposure(featureFlagKey: string): Promise<boolean>;

  static login(userId: string): boolean
  static logout(): any;
  static setCommonProperties(properties: {}): any;
  static unsetCommonProperty(propertiesKey: string): any;
  static clearCommonProperties(): any;
  static getCommonProperties(): any;
  static track(eventCode: string, properties: {}): Promise<boolean>;
  static setLogLevel(level: number): void;
}

