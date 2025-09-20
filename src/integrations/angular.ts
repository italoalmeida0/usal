import { isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  Injectable,
  NgModule,
  Renderer2,
  Inject,
  PLATFORM_ID,
} from '@angular/core';

import USALLib, {
  type LoopType,
  type AnimationType,
  type DirectionType,
  type USALDefaults,
  type USALConfig,
  type USALInstance,
} from '~/usal';

@Directive({
  selector: '[usal], [data-usal]',
  standalone: true,
})
export class USALDirective implements OnInit {
  @Input() usal: string = 'fade';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.renderer.setAttribute(this.el.nativeElement, 'data-usal', this.usal || 'fade');
    }
  }
}

@Injectable({ providedIn: 'root' })
export class USALService {
  config(newConfig: Partial<USALConfig> | undefined): USALInstance | USALConfig {
    if (newConfig) return USALLib.config(newConfig) as USALInstance;
    return USALLib.config() as USALConfig;
  }

  destroy(): Promise<void> {
    return USALLib.destroy();
  }

  restart(): Promise<USALInstance> {
    return USALLib.restart();
  }
  initialized(): boolean {
    return USALLib.initialized();
  }
}

@NgModule({
  imports: [USALDirective],
  exports: [USALDirective],
  providers: [USALService],
})
export class USALModule {}

export type { LoopType, AnimationType, DirectionType, USALDefaults, USALConfig, USALInstance };

export default USALLib;

declare global {
  interface Window {
    USAL: USALInstance;
  }
}
