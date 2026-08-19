import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorForm } from './visitor-form';

describe('VisitorForm', () => {
  let component: VisitorForm;
  let fixture: ComponentFixture<VisitorForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorForm],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
