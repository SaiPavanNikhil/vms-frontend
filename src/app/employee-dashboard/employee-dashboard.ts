import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-employee-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './employee-dashboard.html',
  styleUrl: './employee-dashboard.css'
})
export class EmployeeDashboard implements OnInit {

  employeeName: string = '';
  employeeId: string = '';
  employeeEmail: string = '';


  constructor(
    private router: Router
  ) {}


  ngOnInit(): void {

    this.employeeName =
      sessionStorage.getItem('employeeName') || 'Employee';

    this.employeeId =
      sessionStorage.getItem('employeeId') || '';

    this.employeeEmail =
      sessionStorage.getItem('employeeEmail') || '';

  }


  logout(): void {

    sessionStorage.clear();

    this.router.navigate(['/login']);

  }

}