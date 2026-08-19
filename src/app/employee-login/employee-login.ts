import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../environments/environment.service';
// import { environment } from '../../environments/environment.service';

@Component({
  selector: 'app-employee-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './employee-login.html',
  styleUrl: './employee-login.css',
})
export class EmployeeLogin {
email: string = '';
  password: string = '';

  showPassword: boolean = false;
  loading: boolean = false;

  // private apiUrl = 'http://localhost:8080';


  constructor(
    private http: HttpClient,
    private router: Router
  ) {}


  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }


  login(): void {

    // Remove unnecessary spaces from email
    this.email = this.email.trim();


    // Basic validation
    if (!this.email) {
      alert('Please enter your email.');
      return;
    }

    if (!this.password) {
      alert('Please enter your password.');
      return;
    }


    this.loading = true;


    const loginData = {
      emailId: this.email,
      password: this.password
    };


    this.http.post<any>(
      `${environment.apiBaseUrl}/api/auth/login`,
      loginData
    ).subscribe({

      next: (response) => {

        this.loading = false;


        if (response.success) {

        // Store employee details in session
        sessionStorage.setItem(
          'employeeId',
          String(response.employeeId)
        );

        sessionStorage.setItem(
          'employeeName',
          response.employeeName || ''
        );

        sessionStorage.setItem(
          'employeeEmail',
          response.email || ''
        );

        sessionStorage.setItem(
          'sectionId',
          String(response.sectionId || '')
        );

        console.log(
          'Stored Employee Name:',
          sessionStorage.getItem('employeeName')
        );

        // Navigate to common dashboard
        this.router.navigate(['/employee-dashboard']);

      } else {

          alert(response.message || 'Login failed.');

        }

      },

      error: (error) => {

        this.loading = false;

        console.error('Login error:', error);


        if (error.status === 401) {

          alert(
            error.error?.message ||
            'Invalid email or password.'
          );

        } else {

          alert(
            'Unable to connect to the server. Please try again.'
          );

        }

      }

    });
  }


  private navigateBySection(sectionId: string): void {

    switch (String(sectionId)) {

      case '1':

        this.router.navigate(['/section-1']);
        break;


      case '2':

        this.router.navigate(['/section-2']);
        break;


      case '3':

        this.router.navigate(['/section-3']);
        break;


      case '4':

        this.router.navigate(['/section-4']);
        break;


      default:

        alert(
          'No page is configured for this employee section.'
        );

        break;
    }
  }
}
