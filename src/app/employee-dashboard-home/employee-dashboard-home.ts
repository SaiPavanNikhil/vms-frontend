import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment.service';

interface DashboardStats {
  todaysVisitors: number;
  appointmentsToday: number;
  activePasses: number;
  pendingRequests: number;
}

interface RecentVisitor {
  visitorName: string;
  purpose: string;
  hostName: string;
  time: string;
  status: string;
}

@Component({
  selector: 'app-employee-dashboard-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './employee-dashboard-home.html',
  styleUrl: './employee-dashboard-home.css',
})
export class EmployeeDashboardHome implements OnInit {

  employeeName: string = 'Employee';
  employeeId: string = '';

  loadingStats = signal(true);
  statsError = signal(false);

  stats = signal<DashboardStats>({
    todaysVisitors: 0,
    appointmentsToday: 0,
    activePasses: 0,
    pendingRequests: 0
  });

  loadingVisitors = signal(true);
  visitorsError = signal(false);
  recentVisitors = signal<RecentVisitor[]>([]);

  private readonly apiBase = `${environment.apiBaseUrl}/api/employee-meetings`;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.employeeName = sessionStorage.getItem('employeeName') || 'Employee';

    this.employeeId =
      sessionStorage.getItem('employeeId') ||
      sessionStorage.getItem('empId') ||
      sessionStorage.getItem('employee_id') ||
      sessionStorage.getItem('EmployeeId') ||
      '';

    console.log('Resolved employeeId:', this.employeeId);

    this.loadStats();
    this.loadRecentVisitors();
  }

  loadStats(): void {
    if (!this.employeeId) {
      console.warn('No employeeId found in sessionStorage.');
      this.loadingStats.set(false);
      this.statsError.set(true);
      return;
    }

    this.loadingStats.set(true);
    this.statsError.set(false);

    this.http.get<DashboardStats>(
      `${this.apiBase}/dashboard-stats?employeeId=${this.employeeId}`
    ).subscribe({
      next: (res) => {
        console.log('Dashboard stats received:', res);
        this.stats.set(res);
        this.loadingStats.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard stats', err);
        this.loadingStats.set(false);
        this.statsError.set(true);
      }
    });
  }

  loadRecentVisitors(): void {
    if (!this.employeeId) {
      console.warn('No employeeId found in sessionStorage.');
      this.loadingVisitors.set(false);
      this.visitorsError.set(true);
      return;
    }

    this.loadingVisitors.set(true);
    this.visitorsError.set(false);

    this.http.get<RecentVisitor[]>(
      `${this.apiBase}/recent-visitors?employeeId=${this.employeeId}&limit=4`
    ).subscribe({
      next: (res) => {
        console.log('Recent visitors received:', res);
        this.recentVisitors.set(res);
        this.loadingVisitors.set(false);
      },
      error: (err) => {
        console.error('Failed to load recent visitors', err);
        this.loadingVisitors.set(false);
        this.visitorsError.set(true);
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved': return 'checked-in';
      case 'Rejected': return 'checked-out';
      default: return 'scheduled';
    }
  }
}