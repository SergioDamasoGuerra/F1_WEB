import { Component, computed, OnInit, signal, inject} from '@angular/core';
import { Event } from '../../models/event';
import { DriverStandingCard } from '../../components/driver-standing-card/driver-standing-card';
import {EventsService} from '../../services/events.service';
import { DriverEventStanding, TeamEventStanding } from '../../models/standings';
import { StandingsService } from '../../services/standings-service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-standings',
  imports: [DriverStandingCard],
  templateUrl: './standings.html',
  styleUrl: './standings.css',
  standalone: true,
})
export class Standings implements OnInit {
  private eventsService = inject(EventsService);
  private standingsService = inject(StandingsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  events = signal<Event[]>([]);

  selectedEventId = signal<number | null>(null);
  driverStandings = signal<DriverEventStanding[]>([]);
  teamStandings = signal<TeamEventStanding[]>([]);

  selectedYear = signal<number | null>(null);
  seasonYears = signal<{ year: number }[]>([]);

  selectedDriverIds = signal<number[]>([]);
  selectedTeamIds = signal<number[]>([]);

  constructor() {}

  ngOnInit() {
    this.route.data.subscribe(({ year }) => {
      if (!year) {
        console.log('No se ha leído bien la temporada');
      } else {
        console.log('Temporada recibida correctamente:', year);
        this.clearDriversComp();
        this.clearTeamsComp();
        this.loadEventsForYear(year);
      }
    });

    this.eventsService.getAllSeasonYears().subscribe((years) => {
      // console.log(years);
      this.seasonYears.set(years);
    });
  }

  private scrollToActiveEvent() {
    setTimeout(() => {
      const activeEl = document.getElementById('active-event');
      activeEl?.scrollIntoView({
        behavior: 'smooth', // Animación suave
        block: 'nearest', // Evita que la página verticalmente haga scroll
        inline: 'center', // Centra el botón dentro del div horizontal
      });
    }, 50);
  }

  private loadEventsForYear(year: number) {
    this.selectedYear.set(year);
    this.eventsService.getEvents(year.toString()).subscribe((events) => {
      const filteredEvents = events.filter(
        (event) => !event.name.toLowerCase().includes('testing') && !event.isCancelled,
      );

      this.events.set(filteredEvents);

      const lastDoneEvent = [...events].reverse().find((e) => e.status === 'done');
      if (lastDoneEvent) {
        this.selectEvent(lastDoneEvent.id);
      }
    });
  }

  selectEvent(eventId: number): void {
    this.selectedEventId.set(eventId);

    this.standingsService
      .getDriverStandingsByEvent(eventId)
      .subscribe((standings) => this.driverStandings.set(standings));

    this.standingsService
      .getTeamStandingsByEvent(eventId)
      .subscribe((standings) => this.teamStandings.set(standings));

    this.scrollToActiveEvent();
  }

  readonly selectedEvent = computed(() =>
    this.events().find(e => e.id === this.selectedEventId())
  );

  // COMPARACIÓN DE PILOTOS
  toggleDriverSelection(driverId: number): void {
    const current = this.selectedDriverIds();

    if (current.includes(driverId)) {
      // Si ya está, lo quitamos (toggle)
      this.selectedDriverIds.set(current.filter((id) => id !== driverId));
    } else if (current.length < 2) {
      // Si hay hueco, lo añadimos
      this.selectedDriverIds.set([...current, driverId]);
    }
  }

  selectedDriversData = computed(() => {
    const ids = this.selectedDriverIds();
    const standings = this.driverStandings();

    // Mapear los ID a los objetos DriverEventStanding correspondientes
    return ids
      .map((id) => standings.find((s) => s.driverId === id))
      .filter((s): s is DriverEventStanding => s !== undefined);
  });

  driverDifference = computed(() => {
    const drivers = this.selectedDriversData();
    if (drivers.length !== 2) return null;

    return Math.abs(drivers[0].points - drivers[1].points);
  });

  // COMPARACIÓN DE EQUIPOS
  toggleTeamSelection(teamId: number): void {
    const current = this.selectedTeamIds();

    if (current.includes(teamId)) {
      // Si ya está, lo quitamos (toggle)
      this.selectedTeamIds.set(current.filter((id) => id !== teamId));
    } else if (current.length < 2) {
      // Si hay hueco, lo añadimos
      this.selectedTeamIds.set([...current, teamId]);
    }
  }

  selectedTeamsData = computed(() => {
    const ids = this.selectedTeamIds();
    const standings = this.teamStandings();

    // Mapear los ID a los objetos DriverEventStanding correspondientes
    return ids
      .map((id) => standings.find((s) => s.teamId === id))
      .filter((s): s is TeamEventStanding => s !== undefined);
  });

  teamDifference = computed(() => {
    const teams = this.selectedTeamsData();
    if (teams.length !== 2) return null;

    return Math.abs(teams[0].points - teams[1].points);
  });

  protected getColor(item: DriverEventStanding | TeamEventStanding): string {
    if (!item || !item.team?.seasons) {
      return '#FFFFFF';
    }
    return item.team.seasons[0].colour;
  }

  protected clearDriversComp() {
    this.selectedDriverIds.set([]);
  }

  protected clearTeamsComp() {
    this.selectedTeamIds.set([]);
  }

  protected isDriverSelected(driverId: number): boolean {
    return this.selectedDriverIds().includes(driverId);
  }

  protected isTeamSelected(teamId: number): boolean {
    return this.selectedTeamIds().includes(teamId);
  }

  protected getOfficialName(item: TeamEventStanding) {
    if (!item || !item.team?.seasons) {
      return 'unknown';
    }
    return item.team.seasons[0].officialName;
  }

  onSeasonChange(selectedYear: string) {
    if (selectedYear) {
      this.router.navigate(['/standings', selectedYear]);
    }
  }
}
