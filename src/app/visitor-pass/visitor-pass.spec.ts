import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisitorPass } from './visitor-pass';

describe('VisitorPass', () => {
  let component: VisitorPass;
  let fixture: ComponentFixture<VisitorPass>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorPass],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorPass);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
