import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorManagement } from './visitor-management';

describe('VisitorManagement', () => {
  let component: VisitorManagement;
  let fixture: ComponentFixture<VisitorManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorManagement],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
