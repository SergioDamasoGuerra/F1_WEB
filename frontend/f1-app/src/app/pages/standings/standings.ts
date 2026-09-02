import { Component, computed, OnInit, signal, WritableSignal, inject, effect} from '@angular/core';
import { Driver } from '../../models/driver';
import { Event } from '../../models/event';
import { DriverStandingCard } from '../../components/driver-standing-card/driver-standing-card';
import { TEAM_COLORS } from '../../config/teamcolors'
import { Team } from '../../models/team';
import { DriversService } from '../../services/drivers.service';
import { TeamsService } from '../../services/teams.service';
import {EventsService} from '../../services/events.service';
import { DriverEventStanding, TeamEventStanding } from '../../models/standings';
import { StandingsService } from '../../services/standings-service';

@Component({
  selector: 'app-standings',
  imports: [DriverStandingCard],
  templateUrl: './standings.html',
  styleUrl: './standings.css',
  standalone: true,
})
export class Standings implements OnInit {
  private driversService = inject(DriversService);
  private teamsService = inject(TeamsService);
  private eventsService = inject(EventsService);
  private standingsService = inject(StandingsService);

  events: WritableSignal<Event[]> = signal<Event[]>([]);
  drivers = signal<Driver[]>([]);
  teams = signal<Team[]>([]);

  selectedEventId = signal<number | null>(null);
  driverStandings = signal<DriverEventStanding[]>([]);
  teamStandings = signal<TeamEventStanding[]>([]);

  selectedDrivers = signal<Driver[]>([]);
  selectedTeams = signal<Team[]>([]);

  constructor() {
    // Efecto reactivo: Se ejecuta automáticamente al cambiar selectedEventId
    effect(() => {
      const eventId = this.selectedEventId();
      if (eventId) {
        this.standingsService.getDriverStandingsByEvent(eventId).subscribe((standings) => {
          this.driverStandings.set(standings);
        });

        this.standingsService.getTeamStandingsByEvent(eventId).subscribe((standings) => {
          this.teamStandings.set(standings);
        });

        setTimeout(() => {
          const activeEl = document.getElementById('active-event');
          activeEl?.scrollIntoView({
            behavior: 'smooth', // Animación suave
            block: 'nearest', // Evita que la página verticalmente haga scroll
            inline: 'center', // Centra el botón dentro del div horizontal
          });
        }, 50);
      }
    });
  }

  ngOnInit() {
    this.eventsService.getEvents().subscribe((events) => {
      const filteredEvents = events.filter(
        (event) => !event.name.toLowerCase().includes('testing'),
      );
      this.events.set(filteredEvents);

      // Autoseleccionar el último GP con estado 'done' al cargar la página
      const lastDoneEvent = [...events].reverse().find((e) => e.status === 'done');
      if (lastDoneEvent) {
        this.selectedEventId.set(lastDoneEvent.id);
      }
    });

    this.driversService.getDrivers().subscribe((drivers) => this.drivers.set(drivers));
    this.teamsService.getTeams().subscribe((teams) => this.teams.set(teams));
  }

  selectEvent(eventId: number): void {
    this.selectedEventId.set(eventId);
  }

  selectDriver(driver: Driver, team?: Team) {
    const selected = this.selectedDrivers();

    // Si ya está seleccionado, podemos desmarcarlo (opcional) o retornar
    if (selected.some((d) => d.id === driver.id)) return;

    if (selected.length < 2) {
      // Unimos el piloto con su equipo actual
      const driverWithTeam: Driver = { ...driver, team };

      this.selectedDrivers.set([...selected, driverWithTeam]);
    }
  }

  // Diferencia entre pilotos basada en los standings del GP seleccionado
  driverDifference = computed(() => {
    const selected = this.selectedDrivers();
    const standings = this.driverStandings();

    if (selected.length !== 2 || standings.length === 0) return null;

    const p1 = standings.find((s) => s.driverId === selected[0].id)?.points ?? 0;
    const p2 = standings.find((s) => s.driverId === selected[1].id)?.points ?? 0;

    return Math.abs(p1 - p2);
  });

  selectTeam(team: Team) {
    const selected = this.selectedTeams();
    if (selected.some((t) => t.id === team.id)) return;
    if (selected.length < 2) {
      this.selectedTeams.set([...selected, team]);
    }
  }

  // Diferencia entre equipos calculada dinámicamente
  teamDifference = computed(() => {
    const selected = this.selectedTeams();
    const teamsData = this.teamStandings();

    if (selected.length !== 2 || teamsData.length === 0) return null;

    const p1 = teamsData.find((t) => t.team?.id === selected[0].id)?.points ?? 0;
    const p2 = teamsData.find((t) => t.team?.id === selected[1].id)?.points ?? 0;

    return Math.abs(p1 - p2);
  });

  protected getColor(teamName: string | undefined): string {
    // console.log("getColor", teamName);
    if (!teamName) return '#8575da';
    return TEAM_COLORS[teamName] ?? '#0ad343';
  }

  protected clearDriversComp() {
    this.selectedDrivers.set([]);
  }

  protected clearTeamsComp() {
    this.selectedTeams.set([]);
  }

  protected isItemSelected(item: Driver | Team | undefined): boolean {
    if (!item) return false;
    if ('driverNumber' in item) {
      return this.selectedDrivers().some((driver) => driver.number === item.driverNumber);
    } else {
      return this.selectedTeams().some((team) => team.id === item.id);
    }
  }
}
