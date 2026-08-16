import { Component, OnInit, signal } from '@angular/core';
import { Event } from '../../models/event';
import { EventsService } from '../../services/events.service';
import { EventCard } from '../../components/event-card/event-card';

@Component({
  selector: 'app-schedule',
  imports: [EventCard],
  templateUrl: './schedule.html',
  styleUrl: './schedule.css',
  standalone: true,
})
export class Schedule implements OnInit {
  events = signal<Event[]>([]);

  constructor(private eventsService: EventsService) {}

  ngOnInit() {
    this.eventsService.getEvents().subscribe((events: Event[]) => {
      this.events.set(events);
      setTimeout(() => {
        this.scrollToRelevantEvent();
      });
    });
  }

  private scrollToRelevantEvent(): void {
    const target =
      this.events().find((event) => event.status === 'current') ??
      this.events().find((event) => event.status === 'upcoming');

    if (!target) {
      console.log("no ha encontrado target")
      return;
    }

    const element = document.getElementById(`event-${target.id}`);

    if(!element) {
      console.log('no ha encontrado elemento');
    }

    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }
}
