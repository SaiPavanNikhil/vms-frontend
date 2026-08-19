import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeLogin } from './employee-login';

describe('EmployeeLogin', () => {
  let component: EmployeeLogin;
  let fixture: ComponentFixture<EmployeeLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeLogin],
    }).compileComponents();

    fixture = TestBed.createComponent(EmployeeLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
