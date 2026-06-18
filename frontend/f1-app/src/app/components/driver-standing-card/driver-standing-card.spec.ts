import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverStandingCard } from './driver-standing-card';

describe('DriverStandingCard', () => {
  let component: DriverStandingCard;
  let fixture: ComponentFixture<DriverStandingCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverStandingCard],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverStandingCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
