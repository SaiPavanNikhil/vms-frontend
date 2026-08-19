import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  // =====================================================
  // SECTION APIs
  // =====================================================

  getAllSections(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/sections`);
  }

  getSectionById(sectionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/sections/${sectionId}`);
  }

  addSection(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/sections`, data);
  }

  updateSection(sectionId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/sections/${sectionId}`, data);
  }

  deleteSection(sectionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/sections/${sectionId}`);
  }

  // =====================================================
  // EMPLOYEE APIs
  // =====================================================

  getAllEmployees(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/employees`);
  }

  getEmployeeById(employeeId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/employees/${employeeId}`);
  }

  addEmployee(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/employees`, data);
  }

  updateEmployee(employeeId: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/employees/${employeeId}`, data);
  }

  deleteEmployee(employeeId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/employees/${employeeId}`);
  }
  getAllVisitors(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/visitors`);
  }

  getVisitorDashboardData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/admin-dashboard/visitors`);
  }

  // =====================================================
  // ADMIN DASHBOARD APIs
  // =====================================================

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/admin-dashboard/stats`);
  }

}