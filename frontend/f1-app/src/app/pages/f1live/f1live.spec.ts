import { ComponentFixture, TestBed } from '@angular/core/testing';

import { F1live } from './f1live';

describe('F1live', () => {
  let component: F1live;
  let fixture: ComponentFixture<F1live>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [F1live],
    }).compileComponents();

    fixture = TestBed.createComponent(F1live);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
