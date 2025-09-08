import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnChanges,
  Injectable,
  NgModule,
} from '@angular/core';

import USALLib, { type USALConfig } from '~/usal';

@Injectable({
  providedIn: 'root',
})
export class USALService {
  config(configOptions?: USALConfig): USALConfig | void {
    if (configOptions === undefined) {
      return USALLib.config();
    }
    USALLib.config(configOptions);
  }

  destroy() {
    return USALLib.destroy();
  }

  restart() {
    return USALLib.restart();
  }
}

@Directive({
  selector: '[usal], [data-usal]',
  standalone: false,
})
export class USALDirective implements OnInit, OnChanges {
  @Input('usal') usalValue: string = 'fade';
  @Input('data-usal') dataUsalValue: string = 'fade';

  constructor(private el: ElementRef) {}

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

export const useUSAL = () => ({
  config: (configOptions?: USALConfig): USALConfig | void => {
    if (configOptions === undefined) {
      return USALLib.config();
    }
    USALLib.config(configOptions);
  },
  destroy: () => USALLib.destroy(),
  restart: () => USALLib.restart(),
});

export default USALLib;
