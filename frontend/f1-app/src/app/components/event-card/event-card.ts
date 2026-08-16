import { Component, Input } from '@angular/core';
import { Event } from '../../models/event';
import { RouterLink } from '@angular/router';
import { DatePipe, NgClass, UpperCasePipe } from '@angular/common';
import { capitalizeText, formatDateDDMMM } from '../../config/utils';

@Component({
  selector: 'app-event-card',
  imports: [RouterLink, NgClass, DatePipe, UpperCasePipe],
  templateUrl: './event-card.html',
  styleUrl: './event-card.css',
})
export class EventCard {
  @Input() event!: Event;
  protected readonly capitalizeText = capitalizeText;
  protected readonly formatDateDDMMM = formatDateDDMMM;
}
