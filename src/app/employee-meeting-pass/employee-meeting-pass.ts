import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../environments/environment.service';

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
}

@Component({
  selector: 'app-employee-meeting-pass',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './employee-meeting-pass.html',
  styleUrl: './employee-meeting-pass.css',
})
export class EmployeeMeetingPass implements OnInit {

  private readonly apiUrl = `${environment.apiBaseUrl}/api/employee-meetings/pass`;

  passData: EmployeeMeetingPassResponse | null = null;
  loading = true;
  errorMessage = '';

  constructor(private http: HttpClient, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const meetingId = params.get('meetingId');
      const mobileNo = params.get('mobileNo');

      if (!meetingId || !mobileNo) {
        this.loading = false;
        this.errorMessage = 'Invalid pass link.';
        return;
      }

      this.http
        .get<EmployeeMeetingPassResponse>(this.apiUrl, {
          params: { meetingId, mobileNo },
        })
        .subscribe({
          next: (res) => {
            this.passData = res;
            this.loading = false;
          },
          error: (err) => {
            this.loading = false;
            this.errorMessage = err?.error?.message || 'Unable to load pass.';
          },
        });
    });
  }

  formatDate(date: string): string {
    if (!date) return '';
    const parsed = new Date(date + 'T00:00:00');
    return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}