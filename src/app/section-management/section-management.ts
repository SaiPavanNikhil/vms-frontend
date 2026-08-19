import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';
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

        alert('Unable to load employees.');

      }

    });

  }

  /**
   * Save Section
   */
  saveSection(): void {

    if (!this.sectionForm.sectionName.trim()) {

      alert('Please enter Section Name');

      return;

    }

    this.adminService.addSection(this.sectionForm).subscribe({

      next: (response: any) => {

        alert(response);

        this.loadSections();

        this.clearForm();

      },

      error: (error: any) => {

        console.error(error);

        alert('Unable to save section.');

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

    this.adminService.updateSection(
      this.selectedSectionId,
      this.sectionForm
    ).subscribe({

      next: (response: any) => {

        alert(response);

        this.loadSections();

        this.clearForm();

      },

      error: (error: any) => {

        console.error(error);

        alert('Unable to update section.');

      }

    });

  }

  /**
   * Delete Section
   */
  deleteSection(sectionId: string): void {

    if (!confirm('Are you sure you want to delete this section?')) {

      return;

    }

    this.adminService.deleteSection(sectionId).subscribe({

      next: (response: any) => {

        alert(response);

        this.loadSections();

      },

      error: (error: any) => {

        console.error(error);

        alert('Unable to delete section.');

      }

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