import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnChanges,
  Injectable,
  NgModule,
} from '@angular/core';

import USALLib, { type USALInstance, type USALConfig } from '~/usal';

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

  config(configOptions?: USALConfig): USALConfig | null | void {
    if (!this.instance) return null;

    if (configOptions === undefined) {
      return this.instance.config();
    }

    this.instance.config(configOptions);
  }

  destroy() {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
  }
}

@Directive({
  selector: '[usal], [data-usal]',
  standalone: false,
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
    const value = this.usalValue || this.dataUsalValue || 'fade';
    this.el.nativeElement.setAttribute('data-usal', value);
  }
}

@NgModule({
  declarations: [USALDirective],
  exports: [USALDirective],
  providers: [USALService],
})
export class USALModule {}

export const createUSAL = (config: USALConfig = {}) => {
  const instance = USALLib.createInstance(config);

  return {
    config(configOptions?: USALConfig): USALConfig | void {
      if (configOptions === undefined) {
        return instance.config();
      }
      instance.config(configOptions);
    },
    destroy: () => instance.destroy(),
    getInstance: () => instance,
  };
};

export const useUSAL = () => {
  const instance = USALLib.createInstance();

  return {
    getInstance: () => instance,
    config(configOptions?: USALConfig): USALConfig | void {
      if (configOptions === undefined) {
        return instance.config();
      }
      instance.config(configOptions);
    },
    destroy: () => instance.destroy(),
  };
};

export default USALLib;
