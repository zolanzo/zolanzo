export interface SystemSecurityConfig {
  maintenanceMode: boolean;
  readOnlyMode: boolean;
  emergencyShutdown: boolean;
  requireMfaForAdmin: boolean;
}

class DisasterRecoverySystem {
  private config: SystemSecurityConfig = {
    maintenanceMode: false,
    readOnlyMode: false,
    emergencyShutdown: false,
    requireMfaForAdmin: true,
  };

  public getConfig(): SystemSecurityConfig {
    return { ...this.config };
  }

  public setMaintenanceMode(enabled: boolean): void {
    this.config.maintenanceMode = enabled;
  }

  public setReadOnlyMode(enabled: boolean): void {
    this.config.readOnlyMode = enabled;
  }

  public triggerEmergencyShutdown(enabled: boolean): void {
    this.config.emergencyShutdown = enabled;
  }

  public isMutationAllowed(): boolean {
    return !this.config.maintenanceMode && !this.config.readOnlyMode && !this.config.emergencyShutdown;
  }
}

export const disasterRecovery = new DisasterRecoverySystem();
