import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeMeeting } from './employee-meeting';

describe('EmployeeMeeting', () => {
  let component: EmployeeMeeting;
  let fixture: ComponentFixture<EmployeeMeeting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeMeeting],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeMeeting);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
