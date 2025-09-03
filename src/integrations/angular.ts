import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnChanges,
  Injectable,
  NgModule,
} from '@angular/core';

import type { USALInstance, USALConfig } from '../type/angular';
import USALLib from '../usal.js';

// Service to manage USAL instance
@Injectable({
  providedIn: 'root',
})
export class USALService {
  private instance: USALInstance | null = null;

  constructor() {
    this.instance = USALLib.createInstance();
  }

  getInstance() {
    return this.instance;
  }

  config(configOptions: USALConfig) {
    if (this.instance && configOptions && Object.keys(configOptions).length > 0) {
      this.instance.config(configOptions);
    }
  }

  destroy() {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
  }
}

// Directive for [usal] or [data-usal]
@Directive({
  selector: '[usal], [data-usal]',
})
export class USALDirective implements OnInit, OnChanges {
  @Input('usal') usalValue: string = 'fade';
  @Input('data-usal') dataUsalValue: string = 'fade';

  constructor(
    private el: ElementRef,
    private usalService: USALService
  ) {}

  ngOnInit() {
    this.updateAttribute();
  }

  ngOnChanges() {
    this.updateAttribute();
  }

  private updateAttribute() {
    // Use whichever input was provided
    const value = this.usalValue || this.dataUsalValue || 'fade';
    this.el.nativeElement.setAttribute('data-usal', value);
  }
}

// Module to export everything
@NgModule({
  declarations: [USALDirective],
  exports: [USALDirective],
  providers: [USALService],
})
export class USALModule {}

// Standalone function for non-service usage
export const createUSAL = (config: USALConfig = {}) => {
  const instance = USALLib.createInstance();

  if (config && Object.keys(config).length > 0) {
    instance.config(config);
  }

  return {
    config: (v: USALConfig) => instance.config(v),
    destroy: () => instance.destroy(),
    getInstance: () => instance,
  };
};

export default USALLib;
