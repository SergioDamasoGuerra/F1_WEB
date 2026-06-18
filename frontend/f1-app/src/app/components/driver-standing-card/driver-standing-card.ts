import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Driver } from '../../models/driver';
import { Team } from '../../models/team';

@Component({
  selector: 'app-driver-standing-card',
  imports: [],
  templateUrl: './driver-standing-card.html',
  styleUrl: './driver-standing-card.css',
  standalone: true,
})
export class DriverStandingCard {
  @Input() item!: Driver | Team;
  @Input() selected = false;

  @Output() selectedDriver = new EventEmitter<Driver>();
  @Output() selectedTeam = new EventEmitter<Team>();

  selectItem() {
    if ('driver_number' in this.item) {
      this.selectedDriver.emit(this.item);
    } else {
      this.selectedTeam.emit(this.item);
    }
  }
}
