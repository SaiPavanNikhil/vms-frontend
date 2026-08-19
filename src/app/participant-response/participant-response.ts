import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment.service';

interface ParticipantDetails {
  participantName: string;
  participantEmail: string;
  participantMobile: string;
  organizerName: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  status: string; // 'PENDING' | 'APPROVED' | 'REJECTED'
}

@Component({                                                                                                         
  selector: 'app-participant-response',
  imports: [CommonModule],
  templateUrl: './participant-response.html',
  styleUrl: './participant-response.css',
})
export class ParticipantResponse implements OnInit {

  token = '';
  loadingDetails = true;
  loadError = '';
  details: ParticipantDetails | null = null;

  submitting = false;
  responded = false;
  responseSuccess = false;
  responseMessage = '';
  lastAction: 'approve' | 'reject' | null = null;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.loadingDetails = false;
      this.loadError = 'Invalid link.';
      return;
    }

    this.http.get<ParticipantDetails>(
      `${environment.apiBaseUrl}/api/employee-meetings/participant-response/${this.token}`
    ).subscribe({
      next: (res) => {
        this.loadingDetails = false;
        this.details = res;
        if (res.status !== 'PENDING') {
          this.responded = true;
          this.responseSuccess = true;
          this.lastAction = res.status === 'APPROVED' ? 'approve' : 'reject';
        }
      },
      error: (err) => {
        this.loadingDetails = false;
        this.loadError = err.error?.message || 'Invalid or expired link.';
      }
    });
  }

  respond(action: 'approve' | 'reject'): void {
    if (this.submitting) return;
    this.submitting = true;
    this.lastAction = action;

    this.http.post<any>(
      `${environment.apiBaseUrl}/api/employee-meetings/participant-response`,
      { token: this.token, action }
    ).subscribe({
      next: (response) => {
        this.submitting = false;
        this.responded = true;
        this.responseSuccess = response.success;
        this.responseMessage = response.message;
        if (response.success && this.details) {
          this.details.status = action === 'approve' ? 'APPROVED' : 'REJECTED';
        }
      },
      error: (error) => {
        this.submitting = false;
        this.responded = true;
        this.responseSuccess = false;
        this.responseMessage = error.error?.message || 'Something went wrong.';
      }
    });
  }

  /** Drives which card face is shown: pending action card, approved gate pass, or rejected notice. */
  get displayStatus(): 'PENDING' | 'APPROVED' | 'REJECTED' {
    if (this.details?.status === 'APPROVED' || this.details?.status === 'REJECTED') {
      return this.details.status;
    }
    return 'PENDING';
  }

  /** Short, human-friendly pass ID derived from the token — shown on the gate pass stub. */
  get passId(): string {
    if (!this.token) return '';
    return 'VMS-' + this.token.replace(/-/g, '').slice(0, 8).toUpperCase();
  }

  /** True only when an action attempt failed outright (network/server error), not a clean reject. */
  get hasActionError(): boolean {
    return this.responded && !this.responseSuccess;
  }

  printPass(): void {
    window.print();
  }
}