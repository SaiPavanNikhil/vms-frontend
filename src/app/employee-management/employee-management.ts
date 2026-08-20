import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';
import Swal from 'sweetalert2';
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

  savingEmployee = false;
  updatingEmployee = false;
  deletingEmployee = false;

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

  // ================================
  // VALIDATION
  // ================================

  if (!this.employeeForm.firstName.trim()) {

    Swal.fire({
      icon: 'warning',
      title: 'First Name Required',
      text: 'Please enter First Name.',
      confirmButtonText: 'OK'
    });

    return;
  }

  if (!this.employeeForm.password.trim()) {

    Swal.fire({
      icon: 'warning',
      title: 'Password Required',
      text: 'Please enter Password.',
      confirmButtonText: 'OK'
    });

    return;
  }

  if (!this.employeeForm.sectionId) {

    Swal.fire({
      icon: 'warning',
      title: 'Section Required',
      text: 'Please select Section.',
      confirmButtonText: 'OK'
    });

    return;
  }


  // ================================
  // START LOADER
  // ================================

  this.savingEmployee = true;


  // ================================
  // SAVE EMPLOYEE
  // ================================

  this.adminService
    .addEmployee(this.employeeForm)
    .subscribe({

      next: (response: any) => {

        console.log(
          'Employee saved successfully:',
          response
        );

        // Stop loader BEFORE SweetAlert
        // this.savingEmployee = false;

        Swal.fire({
          icon: 'success',
          title: 'Employee Saved',
          text: 'Employee has been saved successfully.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#16a34a'
        }).then(() => {

          this.loadEmployees();
          this.clearForm();

        });

      },

      error: (error: any) => {

        console.error(
          'Employee save error:',
          error
        );

        this.savingEmployee = false;

        Swal.fire({
          icon: 'error',
          title: 'Unable to Save',
          text:
            error?.error?.message ||
            error?.error ||
            'Unable to save employee. Please try again.',
          confirmButtonText: 'OK'
        });

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

  if (this.updatingEmployee) {
    return;
  }

  this.updatingEmployee = true;

  this.adminService.updateEmployee(
    this.selectedEmployeeId,
    this.employeeForm
  ).subscribe({

    next: (response: any) => {

      console.log(
        'Employee updated successfully:',
        response
      );

      this.updatingEmployee = false;

      Swal.fire({
        icon: 'success',
        title: 'Employee Updated',
        text: 'Employee has been updated successfully.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#16a34a'
      }).then(() => {

        this.loadEmployees();
        this.clearForm();

      });

    },

    error: (error: any) => {

      console.error(
        'Employee update error:',
        error
      );

      this.updatingEmployee = false;

      Swal.fire({
        icon: 'error',
        title: 'Unable to Update',
        text:
          error?.error?.message ||
          error?.error ||
          'Unable to update employee. Please try again.',
        confirmButtonText: 'OK'
      });

    }

  });
}

  /**
   * Delete Employee
   */
 deleteEmployee(employeeId: string): void {

  if (this.deletingEmployee) {
    return;
  }

  Swal.fire({
    icon: 'warning',
    title: 'Delete Employee?',
    text: 'Are you sure you want to delete this employee?',
    showCancelButton: true,
    confirmButtonText: 'Yes, Delete',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280'
  }).then((result) => {

    if (!result.isConfirmed) {
      return;
    }

    this.deletingEmployee = true;

    this.adminService
      .deleteEmployee(employeeId)
      .subscribe({

        next: (response: any) => {

          console.log(
            'Employee deleted successfully:',
            response
          );

          this.deletingEmployee = false;

          Swal.fire({
            icon: 'success',
            title: 'Employee Deleted',
            text: 'Employee has been deleted successfully.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#16a34a'
          }).then(() => {

            this.loadEmployees();

          });

        },

        error: (error: any) => {

          console.error(
            'Employee delete error:',
            error
          );

          this.deletingEmployee = false;

          Swal.fire({
            icon: 'error',
            title: 'Unable to Delete',
            text:
              error?.error?.message ||
              error?.error ||
              'Unable to delete employee. Please try again.',
            confirmButtonText: 'OK'
          });

        }

      });

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