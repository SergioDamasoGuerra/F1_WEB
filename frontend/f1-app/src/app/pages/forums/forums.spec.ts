import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Forums } from './forums';

describe('Forums', () => {
  let component: Forums;
  let fixture: ComponentFixture<Forums>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Forums],
    }).compileComponents();

    fixture = TestBed.createComponent(Forums);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
