import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../environments/environment.service';

interface VisitorPassResponse {
  meetingId: number;
  passNo: string;
  visitorName: string;
  mobileNo: string;
  company: string;
  address: string;
  purpose: string;
  photo: string;
  visitDate: string;
  hostName: string;
  hostDesignation: string;
  department: string;
  requestedMeetingTime: string;
  approvedMeetingTime: string;
  qrCode: string;
}

interface EmployeeMeetingPassResponse {
  meetingId: string;
  passNo: string;
  participantName: string;
  participantOrganisation: string;
  mobileNo: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  hostName: string;
  qrCode: string;
  photo: string;
}

@Component({
  selector: 'app-visitor-pass',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './visitor-pass.html',
  styleUrl: './visitor-pass.css'
})
export class VisitorPass implements OnInit {

  private readonly apiUrl = `${environment.apiBaseUrl}/api/visitor-pass`;
  private readonly employeeApiUrl = `${environment.apiBaseUrl}/api/employee-meetings/pass`;

  private isEmployeeMeeting = false;

  passData: VisitorPassResponse | null = null;

  loading: boolean = true;
  errorMessage: string = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    // Employee-meeting flow: query params, no token
    this.route.queryParamMap.subscribe(queryParams => {
      const meetingId = queryParams.get('meetingId');
      const mobileNo = queryParams.get('mobileNo');

      if (meetingId && mobileNo) {
        this.isEmployeeMeeting = true;
        this.loading = true;
        this.errorMessage = '';
        this.passData = null;

        this.http.get<EmployeeMeetingPassResponse>(this.employeeApiUrl, {
          params: { meetingId, mobileNo }
        }).subscribe({
          next: (response) => {
            // Map the lightweight employee DTO into the visitor-pass display shape
            this.passData = {
              meetingId: Number(response.meetingId),
              passNo: response.passNo,
              visitorName: response.participantName,
              mobileNo: response.mobileNo,
              company: response.participantOrganisation,
              address: '-',
              purpose: response.meetingTitle,
              photo: response.photo || '',
              visitDate: response.meetingDate,
              hostName: response.hostName,
              hostDesignation: '',
              department: '-',
              requestedMeetingTime: response.meetingTime,
              approvedMeetingTime: response.meetingTime,
              qrCode: response.qrCode || ''
            };
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.loading = false;
            this.passData = null;
            this.errorMessage = error?.error?.message || 'Unable to load meeting pass.';
          }
        });

        return; // skip the token-based visitor flow below
      }

      // Existing visitor-pass flow: encrypted token via path param
      this.route.paramMap.subscribe(params => {
        const encryptedToken = params.get('meetingId');

        if (!encryptedToken) {
          this.loading = false;
          this.errorMessage = 'Invalid visitor pass link.';
          return;
        }

        this.isEmployeeMeeting = false;
        this.loading = true;
        this.errorMessage = '';

        this.http.get<{ meetingId: number }>(
          `${this.apiUrl}/decrypt/${encodeURIComponent(encryptedToken)}`
        ).subscribe({
          next: (response) => {
            const meetingId = response.meetingId;
            if (!meetingId) {
              this.loading = false;
              this.errorMessage = 'Invalid visitor pass link.';
              return;
            }
            this.loadVisitorPass(Number(meetingId));
          },
          error: (error) => {
            console.error('Token decryption failed:', error);
            this.loading = false;
            this.passData = null;
            this.errorMessage = 'Invalid or expired visitor pass link.';
          }
        });
      });
    });
  }

  loadVisitorPass(meetingId: number): void {
    this.loading = true;
    this.errorMessage = '';
    this.passData = null;

    this.http.get<VisitorPassResponse>(`${this.apiUrl}/${meetingId}`)
      .subscribe({
        next: (response) => {
          this.passData = response;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.loading = false;
          this.passData = null;
          this.errorMessage = error?.error?.message || 'Unable to load visitor pass.';
        }
      });
  }

  formatDate(date: string): string {
    if (!date) return '';
    const parsedDate = new Date(date + 'T00:00:00');
    return parsedDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getPhotoUrl(mobileNo: string): string {
  if (!mobileNo) {
    return 'assets/default-visitor.png';
  }
  if (this.isEmployeeMeeting) {
    if (!this.passData?.photo) {
      return 'assets/default-visitor.png';
    }
    return `${environment.apiBaseUrl}/api/employee-meetings/photo/${this.passData.meetingId}/${mobileNo}`;
  }
  return `${environment.apiBaseUrl}/api/visitor-pass/photo/${mobileNo}`;
}

onImageError(event: Event): void {
  const image = event.target as HTMLImageElement;
  if (image.src.endsWith('default-visitor.png')) {
    return; // already on fallback, stop — prevents infinite retry loop
  }
  image.src = 'assets/default-visitor.png';
}

  printPass(): void {
    // keep your existing printPass() implementation unchanged here
  }
}