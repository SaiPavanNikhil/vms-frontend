import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectionManagement } from './section-management';

describe('SectionManagement', () => {
  let component: SectionManagement;
  let fixture: ComponentFixture<SectionManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectionManagement],
    }).compileComponents();

    fixture = TestBed.createComponent(SectionManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
