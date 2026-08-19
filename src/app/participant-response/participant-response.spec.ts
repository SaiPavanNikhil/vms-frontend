import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantResponse } from './participant-response';

describe('ParticipantResponse', () => {
  let component: ParticipantResponse;
  let fixture: ComponentFixture<ParticipantResponse>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticipantResponse],
    }).compileComponents();

    fixture = TestBed.createComponent(ParticipantResponse);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
