import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';
import Swal from 'sweetalert2';
// import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-section-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './section-management.html',
  styleUrl: './section-management.css'
})
export class SectionManagement implements OnInit {

  sections: any[] = [];
  filteredSectionList: any[] = [];
  employees: any[] = [];

  searchText = '';

  isEditMode = false;

  selectedSectionId = '';
  sectionActionLoading = false;
  sectionActionLoadingMessage = '';

  sectionForm = {
    sectionName: '',
    inchargeId: ''
  };

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {

    this.loadSections();

    this.loadEmployees();

  }

  /**
   * Load Sections
   */
  loadSections(): void {

    console.log("loadSections called");

    this.adminService.getAllSections().subscribe({

      next: (response: any) => {

        setTimeout(() => {

          this.sections = response;
          this.filteredSectionList = [...response];

          console.log(this.filteredSectionList);

           this.cdr.detectChanges();

        }, 0);

      },

      error: (error: any) => {

        console.log("ERROR");
        console.error(error);

      },

      complete: () => {

        console.log("COMPLETE");

      }

    });

  }

  /**
   * Load Employees
   */
  loadEmployees(): void {

    this.adminService.getAllEmployees().subscribe({

      next: (response: any) => {

        this.employees = response;

      },

      error: (error: any) => {

        console.error(error);

        Swal.fire({
          icon: 'error',
          title: 'Unable to Load Employees',
          text: 'Unable to load employees. Please try again.',
          confirmButtonText: 'OK'
        });

      }

    });
  }

  /**
   * Save Section
   */
  saveSection(): void {

    if (this.sectionForm.sectionName.trim() === '') {

      Swal.fire({
        icon: 'warning',
        title: 'Section Name Required',
        text: 'Please enter Section Name.',
        confirmButtonText: 'OK'
      });

      return;
    }

    if (this.sectionActionLoading) {
      return;
    }

    this.sectionActionLoading = true;
    this.sectionActionLoadingMessage = 'Saving section...';

    this.adminService.addSection(this.sectionForm).subscribe({

      next: (response: any) => {

        console.log(
          'Section saved successfully:',
          response
        );

        this.sectionActionLoading = false;
        this.sectionActionLoadingMessage = '';

        Swal.fire({
          icon: 'success',
          title: 'Section Saved',
          text: 'Section has been saved successfully.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#16a34a'
        }).then(() => {

          this.loadSections();
          this.clearForm();

        });

      },

      error: (error: any) => {

        console.error(
          'Section save error:',
          error
        );

        this.sectionActionLoading = false;
        this.sectionActionLoadingMessage = '';

        Swal.fire({
          icon: 'error',
          title: 'Unable to Save',
          text:
            error?.error?.message ||
            error?.error ||
            'Unable to save section. Please try again.',
          confirmButtonText: 'OK'
        });

      }

    });
  }

  /**
   * Edit Section
   */
  editSection(section: any): void {

    this.selectedSectionId = section.sectionId;

    this.isEditMode = true;

    this.sectionForm = {

      sectionName: section.sectionName,

      inchargeId: section.inchargeId

    };

  }

  /**
   * Update Section
   */
  updateSection(): void {

    if (this.sectionActionLoading) {
      return;
    }

    this.sectionActionLoading = true;
    this.sectionActionLoadingMessage = 'Updating section...';

    this.adminService.updateSection(
      this.selectedSectionId,
      this.sectionForm
    ).subscribe({

      next: (response: any) => {

        console.log(
          'Section updated successfully:',
          response
        );

        this.sectionActionLoading = false;
        this.sectionActionLoadingMessage = '';

        Swal.fire({
          icon: 'success',
          title: 'Section Updated',
          text: 'Section has been updated successfully.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#16a34a'
        }).then(() => {

          this.loadSections();
          this.clearForm();

        });

      },

      error: (error: any) => {

        console.error(
          'Section update error:',
          error
        );

        this.sectionActionLoading = false;
        this.sectionActionLoadingMessage = '';

        Swal.fire({
          icon: 'error',
          title: 'Unable to Update',
          text:
            error?.error?.message ||
            error?.error ||
            'Unable to update section. Please try again.',
          confirmButtonText: 'OK'
        });

      }

    });
  }

  /**
   * Delete Section
   */
  deleteSection(sectionId: string): void {

    if (this.sectionActionLoading) {
      return;
    }

    Swal.fire({
      icon: 'warning',
      title: 'Delete Section?',
      text: 'Are you sure you want to delete this section?',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280'
    }).then((result) => {

      if (!result.isConfirmed) {
        return;
      }

      this.sectionActionLoading = true;
      this.sectionActionLoadingMessage = 'Deleting section...';

      this.adminService.deleteSection(sectionId).subscribe({

        next: (response: any) => {

          console.log(
            'Section deleted successfully:',
            response
          );

          this.sectionActionLoading = false;
          this.sectionActionLoadingMessage = '';

          Swal.fire({
            icon: 'success',
            title: 'Section Deleted',
            text: 'Section has been deleted successfully.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#16a34a'
          }).then(() => {

            this.loadSections();

          });

        },

        error: (error: any) => {

          console.error(
            'Section delete error:',
            error
          );

          this.sectionActionLoading = false;
          this.sectionActionLoadingMessage = '';

          Swal.fire({
            icon: 'error',
            title: 'Unable to Delete',
            text:
              error?.error?.message ||
              error?.error ||
              'Unable to delete section. Please try again.',
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

    this.sectionForm = {

      sectionName: '',

      inchargeId: ''

    };

    this.selectedSectionId = '';

    this.isEditMode = false;

  }

  /**
   * Search
   */
  // filteredSections(): any[] {

  //   if (!this.searchText.trim()) {

  //     return this.sections;

  //   }

  //   return this.sections.filter(section =>

  //     section.sectionName
  //       .toLowerCase()
  //       .includes(this.searchText.toLowerCase())

  //   );

  // }

  onSearch(): void {

    const search = this.searchText.trim().toLowerCase();

    if (!search) {

      this.filteredSectionList = [...this.sections];
      return;

    }

    this.filteredSectionList = this.sections.filter(section =>
      section.sectionName.toLowerCase().includes(search)
    );

  }

}