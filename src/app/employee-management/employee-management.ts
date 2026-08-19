import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';
// import { AdminService } from '../services/admin.service';
// import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './employee-management.html',
  styleUrl: './employee-management.css'
})
export class EmployeeManagement implements OnInit {

  employees: any[] = [];
  filteredEmployeeList: any[] = [];
  sections: any[] = [];

  searchText = '';

  isEditMode = false;

  selectedEmployeeId = '';

  employeeForm = {
    firstName: '',
    lastName: '',
    designation: '',
    sectionId: '',
    mobileNo: '',
    emailId: '',
    password: ''
  };

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    this.loadEmployees();

    this.loadSections();

  }

  /**
   * Load Employees
   */
  loadEmployees(): void {

    this.adminService.getAllEmployees().subscribe({

      next: (response: any) => {

        this.employees = response;
        this.filteredEmployeeList = [...response];

        this.cdr.detectChanges();

      },

      error: (error: any) => {

        console.error(error);

        alert('Unable to load employees.');

      }

    });

  }

  /**
   * Load Sections
   */
  loadSections(): void {

    this.adminService.getAllSections().subscribe({

      next: (response: any) => {

        this.sections = response;

        this.cdr.detectChanges();

      },

      error: (error: any) => {

        console.error(error);

        alert('Unable to load sections.');

      }

    });

  }

  /**
   * Save Employee
   */
  saveEmployee(): void {

    if (!this.employeeForm.firstName.trim()) {

      alert('Please enter First Name');

      return;

    }

    if (!this.employeeForm.password.trim()) {

        alert('Please enter Password');

        return;

    }

    if (!this.employeeForm.sectionId) {

      alert('Please select Section');

      return;

    }

    this.adminService.addEmployee(this.employeeForm).subscribe({

      next: (response: any) => {

        alert(response);

        this.loadEmployees();

        this.clearForm();

      },

      error: (error: any) => {

        console.error(error);

        alert('Unable to save employee.');

      }

    });

  }

  /**
   * Edit Employee
   */
  editEmployee(employee: any): void {

    this.selectedEmployeeId = employee.employeeId;

    this.isEditMode = true;

    this.employeeForm = {

      firstName: employee.firstName,
      lastName: employee.lastName,
      designation: employee.designation,
      sectionId: employee.sectionId,
      mobileNo: employee.mobileNo,
      emailId: employee.emailId,
      password: ''
    };

  }

  /**
   * Update Employee
   */
  updateEmployee(): void {

    this.adminService.updateEmployee(
      this.selectedEmployeeId,
      this.employeeForm
    ).subscribe({

      next: (response: any) => {

        alert(response);

        this.loadEmployees();

        this.clearForm();

      },

      error: (error: any) => {

        console.error(error);

        alert('Unable to update employee.');

      }

    });

  }

  /**
   * Delete Employee
   */
  deleteEmployee(employeeId: string): void {

    if (!confirm('Are you sure you want to delete this employee?')) {

      return;

    }

    this.adminService.deleteEmployee(employeeId).subscribe({

      next: (response: any) => {

        alert(response);

        this.loadEmployees();

      },

      error: (error: any) => {

        console.error(error);

        alert('Unable to delete employee.');

      }

    });

  }

  /**
   * Clear Form
   */
  clearForm(): void {

    this.employeeForm = {

      firstName: '',
      lastName: '',
      designation: '',
      sectionId: '',
      mobileNo: '',
      emailId: '',
      password: ''
    };

    this.selectedEmployeeId = '';

    this.isEditMode = false;

  }

  /**
   * Search Employees
   */
  onSearch(): void {

    const search = this.searchText.trim().toLowerCase();

    if (!search) {

      this.filteredEmployeeList = [...this.employees];

      return;

    }

    this.filteredEmployeeList = this.employees.filter((employee: any) =>

      employee.firstName.toLowerCase().includes(search) ||

      employee.lastName.toLowerCase().includes(search) ||

      employee.designation.toLowerCase().includes(search) ||

      employee.sectionName.toLowerCase().includes(search)

    );

  }

}