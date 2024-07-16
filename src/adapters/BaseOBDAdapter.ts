export interface OBDAdapter {
  initialize(protocolCode: string): Promise<void>;
  queryMode1(pid: string[]): Promise<any>;
  queryMode9(pid: string[]): Promise<any>;
  queryDTCs(command: string): Promise<any>;
  clearDTCs(command: string): Promise<any>;
  detectProtocol(): Promise<{ name: string, code: string }>;
  setupSubscription(): Promise<void>;
  teardownSubscription(): Promise<void>;
}

export interface AdapterCharacteristics {
  serviceUUID: string;
  writableCharacteristicUUID: string;
  notifiableCharacteristicUUID: string;
}

export abstract class BaseOBDAdapter implements OBDAdapter {
  protected device: any;
  protected characteristics: AdapterCharacteristics;
  protected protocol: any;

  constructor(device: any, characteristics: AdapterCharacteristics) {
    this.device = device;
    this.characteristics = characteristics;
  }

  setProtocol(protocol: string) {
    this.protocol = protocol;
  }

  getProtocol(): string | null {
    return this.protocol;
  }

  abstract initialize(protocolCode: string): Promise<void>;
  abstract queryMode1(pid: string[]): Promise<string>;
  abstract queryMode9(pid: string[]): Promise<string>;
  abstract queryDTCs(command: string): Promise<any>;
  abstract clearDTCs(command: string): Promise<any>;
  abstract setupSubscription(): Promise<void>;
  abstract teardownSubscription(): Promise<void>;
  abstract detectProtocol(): Promise<{ name: string, code: string }>;
}