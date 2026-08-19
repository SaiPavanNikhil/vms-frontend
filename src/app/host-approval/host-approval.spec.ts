import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HostApproval } from './host-approval';

describe('HostApproval', () => {
  let component: HostApproval;
  let fixture: ComponentFixture<HostApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostApproval],
    }).compileComponents();

    fixture = TestBed.createComponent(HostApproval);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
