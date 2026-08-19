import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-employee-dashboard-home',
  imports: [CommonModule],
  templateUrl: './employee-dashboard-home.html',
  styleUrl: './employee-dashboard-home.css',
})
export class EmployeeDashboardHome {

  employeeName: string = 'Employee';

  ngOnInit(): void {

    this.employeeName =
      sessionStorage.getItem('employeeName') || 'Employee';

  }
}
