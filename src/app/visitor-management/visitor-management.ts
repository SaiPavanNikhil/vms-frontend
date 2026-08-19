import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';

@Component({
  selector: 'app-visitor-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './visitor-management.html',
  styleUrl: './visitor-management.css'
})
export class VisitorManagement implements OnInit {

  visitors: any[] = [];

  filteredVisitors: any[] = [];


  // ==========================================
  // SEARCH
  // ==========================================

  searchText = '';


  // ==========================================
  // FILTER VALUES
  // ==========================================

  selectedState = '';

  selectedDistrict = '';

  selectedOrganisation = '';


  // ==========================================
  // FILTER OPTIONS
  // ==========================================

  states: string[] = [];

  districts: string[] = [];

  organisations: string[] = [];


  // ==========================================
  // PAGINATION
  // ==========================================

  currentPage = 1;

  pageSize = 10;


  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) { }


  // ==========================================
  // INITIALIZE
  // ==========================================

  ngOnInit(): void {

    this.loadVisitors();

  }


  // ==========================================
  // LOAD VISITORS
  // ==========================================

  loadVisitors(): void {

    this.adminService.getAllVisitors().subscribe({

      next: (response: any) => {

        console.log('Visitors:', response);

        this.visitors = response || [];

        this.filteredVisitors = [
          ...this.visitors
        ];

        this.currentPage = 1;

        this.buildFilterOptions();

        this.cdr.detectChanges();

      },

      error: (error: any) => {

        console.error(error);

        alert('Unable to load visitors.');

      }

    });

  }


  // ==========================================
  // BUILD FILTER OPTIONS
  // ==========================================

  buildFilterOptions(): void {

    // States
    this.states = [
      ...new Set(
        this.visitors
          .map(visitor => visitor.state)
          .filter(
            (state: string) =>
              state && state.trim() !== ''
          )
      )
    ].sort();


    // Organisations
    this.organisations = [
      ...new Set(
        this.visitors
          .map(visitor => visitor.organisation)
          .filter(
            (organisation: string) =>
              organisation &&
              organisation.trim() !== ''
          )
      )
    ].sort();


    // Districts
    this.districts = [
      ...new Set(
        this.visitors
          .map(visitor => visitor.district)
          .filter(
            (district: string) =>
              district &&
              district.trim() !== ''
          )
      )
    ].sort();

  }


  // ==========================================
  // SEARCH
  // ==========================================

  onSearch(): void {

    this.applyFilters();

  }


  // ==========================================
  // STATE CHANGE
  // ==========================================

  onStateChange(): void {

    if (!this.selectedState) {

      this.districts = [
        ...new Set(
          this.visitors
            .map(visitor => visitor.district)
            .filter(
              (district: string) =>
                district &&
                district.trim() !== ''
            )
        )
      ].sort();

    } else {

      this.districts = [
        ...new Set(
          this.visitors
            .filter(
              visitor =>
                visitor.state === this.selectedState
            )
            .map(visitor => visitor.district)
            .filter(
              (district: string) =>
                district &&
                district.trim() !== ''
            )
        )
      ].sort();

    }


    this.selectedDistrict = '';

    this.applyFilters();

  }


  // ==========================================
  // FILTER CHANGE
  // ==========================================

  onFilterChange(): void {

    this.applyFilters();

  }


  // ==========================================
  // APPLY FILTERS
  // ==========================================

  applyFilters(): void {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    this.filteredVisitors = this.visitors.filter(
      (visitor: any) => {

        // SEARCH
        const matchesSearch =

          !search ||

          (visitor.firstName ?? '')
            .toLowerCase()
            .includes(search) ||

          (visitor.lastName ?? '')
            .toLowerCase()
            .includes(search) ||

          (visitor.mobileNo ?? '')
            .toLowerCase()
            .includes(search) ||

          (visitor.organisation ?? '')
            .toLowerCase()
            .includes(search) ||

          (visitor.email ?? '')
            .toLowerCase()
            .includes(search) ||

          (visitor.district ?? '')
            .toLowerCase()
            .includes(search) ||

          (visitor.state ?? '')
            .toLowerCase()
            .includes(search);


        // STATE
        const matchesState =

          !this.selectedState ||

          visitor.state === this.selectedState;


        // DISTRICT
        const matchesDistrict =

          !this.selectedDistrict ||

          visitor.district === this.selectedDistrict;


        // ORGANISATION
        const matchesOrganisation =

          !this.selectedOrganisation ||

          visitor.organisation === this.selectedOrganisation;


        return (

          matchesSearch &&
          matchesState &&
          matchesDistrict &&
          matchesOrganisation

        );

      }
    );


    // Important:
    // Whenever search/filter changes,
    // go back to page 1.
    this.currentPage = 1;

  }


  // ==========================================
  // PAGINATED VISITORS
  // ==========================================

  get paginatedVisitors(): any[] {

    const start =
      (this.currentPage - 1) * this.pageSize;

    const end =
      start + this.pageSize;

    return this.filteredVisitors.slice(
      start,
      end
    );

  }


  // ==========================================
  // TOTAL PAGES
  // ==========================================

  get totalPages(): number {

    return Math.ceil(
      this.filteredVisitors.length / this.pageSize
    );

  }


  // ==========================================
  // PAGE NUMBERS
  // ==========================================

  get pages(): number[] {

    return Array.from(
      { length: this.totalPages },
      (_, index) => index + 1
    );

  }


  // ==========================================
  // START INDEX
  // ==========================================

  get startIndex(): number {

    if (this.filteredVisitors.length === 0) {

      return 0;

    }

    return (
      (this.currentPage - 1) *
      this.pageSize
    );

  }


  // ==========================================
  // END INDEX
  // ==========================================

  get endIndex(): number {

    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredVisitors.length
    );

  }


  // ==========================================
  // GO TO PAGE
  // ==========================================

  goToPage(page: number): void {

    if (
      page < 1 ||
      page > this.totalPages
    ) {

      return;

    }

    this.currentPage = page;

  }


  // ==========================================
  // PREVIOUS PAGE
  // ==========================================

  previousPage(): void {

    if (this.currentPage > 1) {

      this.currentPage--;

    }

  }


  // ==========================================
  // NEXT PAGE
  // ==========================================

  nextPage(): void {

    if (this.currentPage < this.totalPages) {

      this.currentPage++;

    }

  }


  // ==========================================
  // PAGE SIZE CHANGE
  // ==========================================

  onPageSizeChange(): void {

    this.currentPage = 1;

  }


  // ==========================================
  // CLEAR FILTERS
  // ==========================================

  clearFilters(): void {

    this.searchText = '';

    this.selectedState = '';

    this.selectedDistrict = '';

    this.selectedOrganisation = '';


    // Restore districts
    this.districts = [
      ...new Set(
        this.visitors
          .map(visitor => visitor.district)
          .filter(
            (district: string) =>
              district &&
              district.trim() !== ''
          )
      )
    ].sort();


    this.filteredVisitors = [
      ...this.visitors
    ];


    // Reset pagination
    this.currentPage = 1;

  }

}