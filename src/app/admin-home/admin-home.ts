import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../services/admin.service';
// import { AdminService } from '../services/admin.service';
// import { AdminService } from '../../services/admin.service';

interface VisitorDashboard {

  meetingId: number;

  mobileNo: string;

  visitorName: string;

  organisation: string;

  hostId: string;

  hostName: string;

  sectionName: string;

  meetingDate: string;

  meetingTime: string;

  entryTime: string | null;

  exitTime: string | null;

  acceptFlag: string;

  status: string;

}


interface DashboardStats {

  totalMeetingsToday: number;

  activeMeetings: number;

  completedMeetings: number;

}


@Component({
  selector: 'app-admin-home',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './admin-home.html',

  styleUrl: './admin-home.css'
})
export class AdminHome implements OnInit {


  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================

  totalMeetingsToday = 0;

  activeMeetings = 0;

  completedMeetings = 0;


  // ==========================================
  // VISITOR DATA
  // ==========================================

  visitors: VisitorDashboard[] = [];

  filteredVisitors: VisitorDashboard[] = [];

  searchText = '';


  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) { }


  // ==========================================
  // INITIALIZE
  // ==========================================

  ngOnInit(): void {

    this.loadDashboardStats();

    this.loadVisitorDashboard();

  }


  // ==========================================
  // LOAD DASHBOARD COUNTS
  // ==========================================

  loadDashboardStats(): void {

    this.adminService.getDashboardStats().subscribe({

      next: (response: DashboardStats) => {

        console.log(
          'Dashboard Stats Response:',
          response
        );


        this.totalMeetingsToday =
          response.totalMeetingsToday ?? 0;


        this.activeMeetings =
          response.activeMeetings ?? 0;


        this.completedMeetings =
          response.completedMeetings ?? 0;


        // Angular 21 change detection
        this.cdr.detectChanges();

      },

      error: (error: any) => {

        console.error(
          'Unable to load dashboard statistics:',
          error
        );

      }

    });

  }


  // ==========================================
  // LOAD VISITOR DATA
  // ==========================================

  loadVisitorDashboard(): void {

    this.adminService.getVisitorDashboardData().subscribe({

      next: (response: VisitorDashboard[]) => {

        console.log(
          'Visitor Dashboard Response:',
          response
        );


        this.visitors = response || [];

        this.filteredVisitors = [
          ...this.visitors
        ];


        // Angular 21 change detection
        this.cdr.detectChanges();

      },

      error: (error: any) => {

        console.error(
          'Unable to load visitor dashboard:',
          error
        );


        this.visitors = [];

        this.filteredVisitors = [];

        this.cdr.detectChanges();

      }

    });

  }


  // ==========================================
  // SEARCH VISITORS
  // ==========================================

  onSearch(): void {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    // Show all visitors
    if (!search) {

      this.filteredVisitors = [
        ...this.visitors
      ];

      return;

    }


    // Filter visitors
    this.filteredVisitors =
      this.visitors.filter(
        (visitor: VisitorDashboard) =>

          (visitor.visitorName ?? '')
            .toLowerCase()
            .includes(search)

          ||

          (visitor.mobileNo ?? '')
            .toLowerCase()
            .includes(search)

          ||

          (visitor.organisation ?? '')
            .toLowerCase()
            .includes(search)

          ||

          (visitor.hostName ?? '')
            .toLowerCase()
            .includes(search)

          ||

          (visitor.sectionName ?? '')
            .toLowerCase()
            .includes(search)

      );

  }

}