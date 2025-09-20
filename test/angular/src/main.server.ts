import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { APP_BASE_HREF } from '@angular/common';
import { provideServerRendering } from '@angular/platform-server';

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(
    App,
    {
      providers: [[], provideServerRendering(), { provide: APP_BASE_HREF, useValue: '/' }],
    },
    context,
  );

export default bootstrap;
