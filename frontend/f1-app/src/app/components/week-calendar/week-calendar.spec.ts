import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeekCalendar } from './week-calendar';

describe('WeekCalendar', () => {
  let component: WeekCalendar;
  let fixture: ComponentFixture<WeekCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeekCalendar],
    }).compileComponents();

    fixture = TestBed.createComponent(WeekCalendar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
