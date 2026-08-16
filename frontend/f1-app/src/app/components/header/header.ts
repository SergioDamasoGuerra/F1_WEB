import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  f1LiveMenuOpen = false;

  toggleF1LiveMenu() {
    this.f1LiveMenuOpen = !this.f1LiveMenuOpen;
  }
}
