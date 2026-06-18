import { Component, computed, OnInit, signal } from '@angular/core';
import { ChampionshipDriver } from '../../models/championship-driver';
import { DriverInfo } from '../../models/driver-info';
import { Driver } from '../../models/driver';
import { DriverStandingCard } from '../../components/driver-standing-card/driver-standing-card';
import { TEAM_COLORS } from '../../config/teamcolors'
import { Team } from '../../models/team';

@Component({
  selector: 'app-f1live',
  imports: [DriverStandingCard],
  templateUrl: './f1live.html',
  styleUrl: './f1live.css',
  standalone: true,
})
export class F1live implements OnInit {
  championshipDrivers = signal<ChampionshipDriver[]>([]);
  driversInfo = signal<DriverInfo[]>([]);
  drivers = signal<Driver[]>([]);
  teams = signal<Team[]>([]);

  selectedDrivers = signal<Driver[]>([]);
  selectedTeams = signal<Team[]>([]);

  ngOnInit() {
    fetch('https://api.openf1.org/v1/championship_drivers?session_key=latest')
      .then((res) => res.json())
      .then((data: ChampionshipDriver[]) => {
        this.championshipDrivers.set(data);
        this.createDrivers();
      });

    fetch('https://api.openf1.org/v1/drivers?session_key=latest')
      .then((res) => res.json())
      .then((data: DriverInfo[]) => {
        this.driversInfo.set(data);
        this.createDrivers();
      });

    fetch('https://api.openf1.org/v1/championship_teams?session_key=latest')
      .then((res) => res.json())
      .then((data: Team[]) => {
        this.teams.set(data);
        this.createDrivers();
      });
  }

  createDrivers() {
    if (this.championshipDrivers().length === 0 || this.driversInfo().length === 0) {
      return;
    }

    const merged: Driver[] = this.championshipDrivers().map((result) => {
      const info = this.driversInfo().find(
        (driver) => driver.driver_number === result.driver_number,
      );

      return {
        driver_number: result.driver_number,
        name: info?.full_name ?? 'Unknown',
        acronym: info?.name_acronym,
        team_name: info?.team_name ?? 'Unknown',
        team_color: info ? TEAM_COLORS[info.team_name] : '',
        points_current: result.points_current,
        position_current: result.position_current,
        image: info?.headshot_url ?? '',
      };
    });

    this.drivers.set(merged);
  }

  selectDriver(driver: Driver) {
    const selected = this.selectedDrivers();

    if (selected.length < 2) {
      this.selectedDrivers.set([...selected, driver]);
    }
  }

  driverDifference = computed(() => {
    const drivers = this.selectedDrivers();

    if (drivers.length !== 2) return null;

    return Math.abs(drivers[0].points_current - drivers[1].points_current);
  });

  selectTeam(team: Team) {
    const selected = this.selectedTeams();

    if (selected.length < 2) {
      this.selectedTeams.set([...selected, team]);
    }
  }

  teamDifference = computed(() => {
    const teams = this.selectedTeams();

    if (teams.length !== 2) return null;

    return Math.abs(teams[0].points_current - teams[1].points_current);
  });

  protected getColor(team: Team) {
    return TEAM_COLORS[team.team_name];
  }

  protected clearDriversComp() {
    this.selectedDrivers.set([]);
  }
  protected clearTeamsComp() {
    this.selectedTeams.set([]);
  }

  protected isItemSelected(item: Driver | Team): boolean {
    if ('driver_number' in item) {
      return this.selectedDrivers().some((driver) => driver.driver_number === item.driver_number);
    } else {
      return this.selectedTeams().some((team) => team.team_name === item.team_name);
    }
  }

}
