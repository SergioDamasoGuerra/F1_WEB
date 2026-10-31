import { Component, OnInit, signal } from '@angular/core';
import { Event } from '../../models/event';
import {EventLinkButton} from '../../models/event-page.model'
import { EventsService } from '../../services/events.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { slugify } from '../../utils/slug.utils';
import { DatePipe, NgClass, UpperCasePipe } from '@angular/common';
import { Session, SessionDay } from '../../models/session';

@Component({
  selector: 'app-event',
  imports: [RouterLink, DatePipe, UpperCasePipe, NgClass],
  templateUrl: './event.html',
  styleUrl: './event.css',
})
export class EventPage implements OnInit {
  mainEvent = signal<Event | null>(null);
  pastEvent = signal<EventLinkButton | null>(null);
  nextEvent = signal<EventLinkButton | null>(null);

  constructor(
    private route: ActivatedRoute,
    private eventService: EventsService,
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const yearParam = params.get('year');
      const nameParam = params.get('name');
      if (!yearParam || !nameParam) {
        console.log('no year param or name param provided');
        return;
      }

      this.eventService
        .getEventWithNeighbors(Number(yearParam), nameParam)
        .subscribe((eventNeighbor) => {
          this.mainEvent.set(eventNeighbor.currentEvent);
          this.pastEvent.set(eventNeighbor.pastEvent);
          this.nextEvent.set(eventNeighbor.nextEvent);

          const event = this.mainEvent();
          if (event && event.sessions) {
            this.days = this.groupSessionsByDay(event.sessions);
          }
        });
    });
  }

  protected readonly fetch = fetch;
  protected readonly slugify = slugify;
  protected days: SessionDay[] = [];

  private groupSessionsByDay(sessions: Session[]): SessionDay[] {
    const days = new Map<string, Session[]>();

    for (const session of sessions) {
      const date = session.startDate.split('T')[0];

      const day = days.get(date) ?? [];
      day.push(session);
      days.set(date, day);
    }

    return Array.from(days, ([date, sessions]) => ({
      date,
      sessions,
    }));
  }

  protected getStatusText() {
    // status: "done" | "current" | "upcoming" | "cancelled"
    if (this.mainEvent()?.status == 'done') {
      return 'EVENT DONE';
    } else if (this.mainEvent()?.status == 'current') {
      return 'CURRENT EVENT!';
    } else if (this.mainEvent()?.status == 'upcoming') {
      return 'UPCOMING EVENT';
    } else {
      // cancelled
      return 'EVENT CANCELLED';
    }
  }
}
