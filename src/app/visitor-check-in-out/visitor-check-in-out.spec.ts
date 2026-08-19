import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorCheckInOut } from './visitor-check-in-out';

describe('VisitorCheckInOut', () => {
  let component: VisitorCheckInOut;
  let fixture: ComponentFixture<VisitorCheckInOut>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorCheckInOut],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorCheckInOut);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
