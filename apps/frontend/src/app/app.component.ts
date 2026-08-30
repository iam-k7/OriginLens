import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { FooterComponent } from './layout/footer/footer.component';

@Component({
  selector: 'ol-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <ol-navbar></ol-navbar>
    <main class="ol-main">
      <router-outlet></router-outlet>
    </main>
    <ol-footer></ol-footer>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }
      .ol-main {
        flex: 1;
        display: block;
      }
    `,
  ],
})
export class AppComponent {}
