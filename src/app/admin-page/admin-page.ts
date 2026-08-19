import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Visitor {
  name: string;
  employee: string;
  purpose: string;
  timeIn: string;
  timeOut: string;
  status: string;
}

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.css'
})
export class AdminPage {
  searchTerm = '';

  visitors: Visitor[] = [
    { name: 'Rohan Malhotra', employee: 'Ananya Kapoor', purpose: 'Vendor demo', timeIn: '09:12 AM', timeOut: '-', status: 'In' },
    { name: 'Priya Nair', employee: 'Facilities', purpose: 'Courier delivery', timeIn: '09:40 AM', timeOut: '-', status: 'In' },
    { name: 'Arjun Bhatt', employee: 'HR Team', purpose: 'Job interview', timeIn: '10:00 AM', timeOut: '-', status: 'In' },
    { name: 'Meera Shah', employee: 'Vikram Desai', purpose: 'Client meeting', timeIn: '08:15 AM', timeOut: '09:05 AM', status: 'Out' }
  ];

  get filteredVisitors(): Visitor[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.visitors;
    return this.visitors.filter(v =>
      v.name.toLowerCase().includes(term) ||
      v.employee.toLowerCase().includes(term)
    );
  }

  get totalToday(): number {
    return this.visitors.length;
  }

  get currentlyIn(): number {
    return this.visitors.filter(v => v.status === 'In').length;
  }

  get checkedOut(): number {
    return this.visitors.filter(v => v.status === 'Out').length;
  }

  checkOut(visitor: Visitor): void {
    if (visitor.status === 'Out') return;
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    visitor.timeOut = `${hours}:${minutes} ${ampm}`;
    visitor.status = 'Out';
  }
}