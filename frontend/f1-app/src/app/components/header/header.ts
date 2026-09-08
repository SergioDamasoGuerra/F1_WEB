import { Component, inject, OnInit, signal } from '@angular/core';
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

  private eventsService = inject(EventsService);
  protected latestSeason = signal<number>(new Date().getFullYear());

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

  protected getLatestSeason() {
    return this.eventsService.getLatestSeason();
  }
}
