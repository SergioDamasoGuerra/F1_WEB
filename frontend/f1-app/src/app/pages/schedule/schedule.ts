import { Component, computed, OnInit, signal } from '@angular/core';
import { Event } from '../../models/event';
import { CalendarWeek } from '../../models/event';
import { EventsService } from '../../services/events.service';
import { EventCard } from '../../components/event-card/event-card';
import {CalendarService} from '../../services/calendar.service';
import {WeekCalendar} from '../../components/week-calendar/week-calendar';

@Component({
  selector: 'app-schedule',
  imports: [EventCard, WeekCalendar],
  templateUrl: './schedule.html',
  styleUrl: './schedule.css',
  standalone: true,
})
export class Schedule implements OnInit {
  events = signal<Event[]>([]);
  weeks: CalendarWeek[] = [];

  constructor(
    private eventsService: EventsService,
    private calendarService: CalendarService,
  ) {}

  ngOnInit() {
    this.eventsService.getEvents().subscribe((events: Event[]) => {
      this.events.set(events);
      this.weeks = this.calendarService.generateWeeks(this.events());
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
      console.log('no ha encontrado target');
      return;
    }

    const element = document.getElementById(`event-${target.id}`);

    if (!element) {
      console.log('no ha encontrado elemento');
    }

    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }

  scrollToEvent(event: Event): void {
    if(!event) return;

    const element = document.getElementById(`event-${event.id}`);

    if (!element) {
      console.log('no ha encontrado elemento');
    }

    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }
}
