import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeDashboardHome } from './employee-dashboard-home';

describe('EmployeeDashboardHome', () => {
  let component: EmployeeDashboardHome;
  let fixture: ComponentFixture<EmployeeDashboardHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeDashboardHome],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeDashboardHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
