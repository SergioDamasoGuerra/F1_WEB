import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Event, CalendarWeek } from '../../models/event';
import { formatRange } from '../../config/utils';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-week-calendar',
  imports: [NgClass],
  templateUrl: './week-calendar.html',
  styleUrl: './week-calendar.css',
})
export class WeekCalendar {
  @Input({ required: true })
  weeks!: CalendarWeek[];

  @Output()
  eventSelected = new EventEmitter<Event>();
  protected readonly formatRange = formatRange;
}
