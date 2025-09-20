import { Component } from '@angular/core';
import { USALModule } from '@usal/angular';

@Component({
  selector: 'app-root',
  imports: [USALModule],
  template:
    '<p usal="split-letter loop duration-200">Congratulations! Your App+Angular is running. 🎉</p>',
})
export class App {}
