import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Minigames } from './minigames';

describe('Minigames', () => {
  let component: Minigames;
  let fixture: ComponentFixture<Minigames>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Minigames],
    }).compileComponents();

    fixture = TestBed.createComponent(Minigames);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
