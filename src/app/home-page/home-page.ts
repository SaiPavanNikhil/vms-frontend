import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface VisitorRow {
  name: string;
  host: string;
  purpose: string;
  time: string;
  status: 'in' | 'expected' | 'out';
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  clockLabel = '';
  private clockTimer: ReturnType<typeof setInterval> | undefined;

  visitorName = '';
  visitorHost = '';
  visitorReason = '';
  badgeId = 'VMS-0000';
  private badgeCounter = 214;

  submitLabel = 'Print badge and notify host';
  submitState: 'idle' | 'success' = 'idle';
  private resetTimer: ReturnType<typeof setTimeout> | undefined;

  roster: VisitorRow[] = [
    { name: 'Rohan Malhotra', host: 'Dr. S. Iyer, Pathology', purpose: 'Equipment vendor meeting', time: '09:12 AM', status: 'in' },
    { name: 'Priya Nair', host: 'Admin Office', purpose: 'Document submission', time: '09:40 AM', status: 'in' },
    { name: 'Arjun Bhatt', host: 'HR Department', purpose: 'Interview', time: '10:00 AM', status: 'expected' },
    { name: 'Meera Shah', host: 'Dr. K. Rao, Director', purpose: 'Project review', time: '08:15 AM', status: 'out' }
  ];

  ngOnInit(): void {
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 30000);
  }

  ngOnDestroy(): void {
    if (this.clockTimer) clearInterval(this.clockTimer);
    if (this.resetTimer) clearTimeout(this.resetTimer);
  }

  private updateClock(): void {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    this.clockLabel = `${hours}:${minutes} ${ampm}`;
  }

  issueBadge(): void {
    if (!this.visitorName.trim()) {
      return;
    }
    this.badgeCounter++;
    this.badgeId = `VMS-${this.badgeCounter}`;
    this.submitState = 'success';
    this.submitLabel = 'Badge printed — host notified';

    if (this.resetTimer) clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => {
      this.submitState = 'idle';
      this.submitLabel = 'Print badge and notify host';
    }, 2200);
  }

  statusLabel(status: VisitorRow['status']): string {
    return status === 'in' ? 'Checked in' : status === 'expected' ? 'Expected' : 'Checked out';
  }
}