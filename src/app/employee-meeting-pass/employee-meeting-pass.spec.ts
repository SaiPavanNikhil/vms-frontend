import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeMeetingPass } from './employee-meeting-pass';

describe('EmployeeMeetingPass', () => {
  let component: EmployeeMeetingPass;
  let fixture: ComponentFixture<EmployeeMeetingPass>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeMeetingPass],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeMeetingPass);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
