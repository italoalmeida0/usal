import { Directive, ElementRef, Input, OnInit, Injectable, NgModule } from '@angular/core';
import USAL, { USALConfig, USALInstance } from '../usal';

@Injectable({
  providedIn: 'root',
})
export declare class USALService {
  private instance;
  constructor();
  getInstance(): USALInstance | null;
  config(configOptions: USALConfig): void;
  destroy(): void;
}

@Directive({
  selector: '[usal], [data-usal]',
})
export declare class USALDirective implements OnInit {
  usalValue: string;
  dataUsalValue: string;
  constructor(el: ElementRef, usalService: USALService);
  ngOnInit(): void;
  ngOnChanges(): void;
}

@NgModule({
  declarations: [USALDirective],
  exports: [USALDirective],
  providers: [USALService],
})
export declare class USALModule {}

export declare const createUSAL: (config?: USALConfig) => {
  config: (config: USALConfig) => void;
  destroy: () => void;
  getInstance: () => USALInstance | null;
};

export default USAL;
