import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventPage } from './event';

describe('EventPage', () => {
  let component: EventPage;
  let fixture: ComponentFixture<EventPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Event],
    }).compileComponents();

    fixture = TestBed.createComponent(EventPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
