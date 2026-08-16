import { Component, computed, OnInit, signal } from '@angular/core';
import { Driver } from '../../models/driver';
import { DriverStandingCard } from '../../components/driver-standing-card/driver-standing-card';
import { TEAM_COLORS } from '../../config/teamcolors'
import { Team } from '../../models/team';
import { DriversService } from '../../services/drivers.service';
import { TeamsService } from '../../services/teams.service';

@Component({
  selector: 'app-standings',
  imports: [DriverStandingCard],
  templateUrl: './standings.html',
  styleUrl: './standings.css',
  standalone: true,
})
export class Standings implements OnInit {
  drivers = signal<Driver[]>([]);
  teams = signal<Team[]>([]);

  selectedDrivers = signal<Driver[]>([]);
  selectedTeams = signal<Team[]>([]);

  constructor(
    private driversService: DriversService,
    private teamsService: TeamsService,
  ) {}

  ngOnInit() {
    this.driversService.getDrivers().subscribe((drivers) => {
      this.drivers.set(drivers);
    });

    this.teamsService.getTeams().subscribe((teams) => {
      this.teams.set(teams);
    });
  }

  selectDriver(driver: Driver) {
    const selected = this.selectedDrivers();
    if (selected.includes(driver)) return;
    if (selected.length < 2) {
      this.selectedDrivers.set([...selected, driver]);
    }
  }

  driverDifference = computed(() => {
    const drivers = this.selectedDrivers();

    if (drivers.length !== 2) return null;

    return Math.abs(drivers[0].points - drivers[1].points);
  });

  selectTeam(team: Team) {
    const selected = this.selectedTeams();
    if (selected.includes(team)) return;
    if (selected.length < 2) {
      this.selectedTeams.set([...selected, team]);
    }
  }

  teamDifference = computed(() => {
    const teams = this.selectedTeams();

    if (teams.length !== 2) return null;

    return Math.abs(teams[0].points - teams[1].points);
  });

  protected getColor(team: Team) {
    return TEAM_COLORS[team.name];
  }

  protected clearDriversComp() {
    this.selectedDrivers.set([]);
  }
  protected clearTeamsComp() {
    this.selectedTeams.set([]);
  }

  protected isItemSelected(item: Driver | Team): boolean {
    if ('driverNumber' in item) {
      return this.selectedDrivers().some((driver) => driver.driverNumber === item.driverNumber);
    } else {
      return this.selectedTeams().some((team) => team.name === item.name);
    }
  }
}
