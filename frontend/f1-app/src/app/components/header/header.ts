import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventsService } from '../../services/events.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  f1LiveMenuOpen = false;
  verticalMenuOpen = false;

  @HostListener('window:resize')
  onScreenSizeChange() {
    if (window.innerWidth <= 800) {
      this.f1LiveMenuOpen = false;
    } else {
      this.verticalMenuOpen = false;
    }
  }

  private eventsService = inject(EventsService);
  protected latestSeason = signal<number>(new Date().getFullYear());

  f1LiveLinks = [
    {
      name: 'Standings',
      route: ['/standings', this.latestSeason()],
    },
    {
      name: 'Schedule',
      route: ['/schedule', this.latestSeason()],
    },
  ];

  mainNavLinks = [
    {
      name: 'Forums',
      route: '/forums',
    },
    {
      name: 'Minigames',
      route: '/minigames',
    },
  ];

  ngOnInit() {
    this.eventsService.getLatestSeason().subscribe({
      next: (data) => {
        this.latestSeason.set(data.year);
      },
      error: (err) => console.error('Error cargando última temporada', err),
    });
  }

  toggleF1LiveMenu() {
    this.f1LiveMenuOpen = !this.f1LiveMenuOpen;
  }

  toggleVerticalMenu() {
    this.verticalMenuOpen = !this.verticalMenuOpen;

    if (!this.verticalMenuOpen) {
      this.f1LiveMenuOpen = false;
    }
  }
}
