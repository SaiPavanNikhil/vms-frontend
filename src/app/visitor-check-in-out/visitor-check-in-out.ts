import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '../environments/environment.service';

interface VisitorCheckInResponse {
  mobileNo: string;
  firstName: string;
  lastName: string;
  organisation: string;

  meetingId: number;
  hostId: string;

  approvedMeetingDate: string;
  approvedMeetingTime: string;

  acceptFlag: string;

  entryTime: string | null;
  exitTime: string | null;
}

interface VisitorCheckInRequest {
  mobileNo: string;
  meetingId: number;
}

@Component({
  selector: 'app-visitor-check-in-out',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule
  ],
  templateUrl: './visitor-check-in-out.html',
  styleUrl: './visitor-check-in-out.css',
})
export class VisitorCheckInOut {

  // =========================================================
  // MOBILE NUMBER
  // =========================================================

  mobileNo: string = '';


  // =========================================================
  // VISITOR DATA
  // =========================================================

  visitorData: VisitorCheckInResponse | null = null;


  // =========================================================
  // STATES
  // =========================================================

  searching: boolean = false;

  processing: boolean = false;


  // =========================================================
  // MESSAGES
  // =========================================================

  errorMessage: string = '';

  successMessage: string = '';


  // =========================================================
  // PREVENT DUPLICATE SEARCH
  // =========================================================

  private lastSearchedMobile: string = '';


  // =========================================================
  // PREVENT DUPLICATE CHECK-IN / CHECK-OUT
  // =========================================================

  private actionInProgress: boolean = false;


  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}


  // =========================================================
  // MOBILE INPUT
  // =========================================================

  onMobileInput(): void {

    // ---------------------------------------------------------
    // Keep only numbers
    // ---------------------------------------------------------

    this.mobileNo =
      this.mobileNo.replace(/\D/g, '');


    // ---------------------------------------------------------
    // Maximum 10 digits
    // ---------------------------------------------------------

    if (this.mobileNo.length > 10) {

      this.mobileNo =
        this.mobileNo.substring(0, 10);
    }


    // ---------------------------------------------------------
    // Clear messages
    // ---------------------------------------------------------

    this.errorMessage = '';

    this.successMessage = '';


    // ---------------------------------------------------------
    // Reset visitor when number changes
    // ---------------------------------------------------------

    if (
      this.mobileNo !== this.lastSearchedMobile
    ) {

      this.visitorData = null;
    }


    // ---------------------------------------------------------
    // Automatic search after 10 digits
    // ---------------------------------------------------------

    if (
      this.mobileNo.length === 10 &&
      this.mobileNo !== this.lastSearchedMobile &&
      !this.searching &&
      !this.processing
    ) {

      this.searchVisitor();
    }
  }


  // =========================================================
  // API 1
  // SEARCH VISITOR
  // =========================================================

  searchVisitor(): void {

    // ---------------------------------------------------------
    // Validation
    // ---------------------------------------------------------

    if (!/^\d{10}$/.test(this.mobileNo)) {

      this.errorMessage =
        'Please enter a valid 10 digit mobile number.';

      return;
    }


    // ---------------------------------------------------------
    // Prevent duplicate request
    // ---------------------------------------------------------

    if (
      this.searching ||
      this.processing ||
      this.actionInProgress
    ) {

      return;
    }


    // ---------------------------------------------------------
    // Clear previous state
    // ---------------------------------------------------------

    this.errorMessage = '';

    this.successMessage = '';

    this.visitorData = null;


    // ---------------------------------------------------------
    // Mark as searching
    // ---------------------------------------------------------

    this.searching = true;

    this.lastSearchedMobile = this.mobileNo;


    // ---------------------------------------------------------
    // Search API
    // ---------------------------------------------------------

    this.http.get<VisitorCheckInResponse>(
      `${environment.apiBaseUrl}/api/visitor-checkin/search/${this.mobileNo}`
    )
    .subscribe({

      // =======================================================
      // SEARCH SUCCESS
      // =======================================================

      next: (response) => {

        this.searching = false;

        this.visitorData = response;


        console.log(
          'Visitor details fetched:',
          response
        );

        this.cdr.detectChanges();

        // -----------------------------------------------------
        // Check meeting acceptance
        // -----------------------------------------------------

        if (
          response.acceptFlag !== 'Y'
        ) {

          this.errorMessage =
            'Your meeting has not been accepted.';

          return;
        }


        // -----------------------------------------------------
        // Already completed
        // -----------------------------------------------------

        if (
          response.entryTime &&
          response.exitTime
        ) {

          this.successMessage =
            'This visit has already been completed.';

          return;
        }


        // -----------------------------------------------------
        // AUTOMATIC ACTION
        // -----------------------------------------------------
        //
        // No entry time:
        //       AUTO CHECK-IN
        //
        // Entry exists but no exit:
        //       AUTO CHECK-OUT
        //
        // -----------------------------------------------------

        if (!response.entryTime) {

          console.log(
            'Visitor is not checked in. Starting automatic check-in...'
          );

          this.performAutomaticAction('check-in');
          this.cdr.detectChanges();

        }
        else if (
          response.entryTime &&
          !response.exitTime
        ) {

          console.log(
            'Visitor is already checked in. Starting automatic check-out...'
          );

          this.performAutomaticAction('check-out');
        }
        this.cdr.detectChanges();

      },


      // =======================================================
      // SEARCH ERROR
      // =======================================================

      error: (error) => {

        this.searching = false;

        this.visitorData = null;

        this.lastSearchedMobile = '';


        this.errorMessage =
          error?.error?.message ||
          'No accepted meeting found for today.';


        console.error(
          'Visitor search error:',
          error
        );

      }

    });
  }


  // =========================================================
  // AUTOMATIC CHECK-IN / CHECK-OUT
  // =========================================================

  private performAutomaticAction(
    action: 'check-in' | 'check-out'
  ): void {

    // ---------------------------------------------------------
    // Make sure visitor data exists
    // ---------------------------------------------------------

    if (!this.visitorData) {

      this.errorMessage =
        'Visitor information is not available.';

      return;
    }


    // ---------------------------------------------------------
    // Prevent duplicate action
    // ---------------------------------------------------------

    if (this.actionInProgress) {

      return;
    }


    // ---------------------------------------------------------
    // Make sure meeting ID exists
    // ---------------------------------------------------------

    if (!this.visitorData.meetingId) {

      this.errorMessage =
        'Meeting information is not available.';

      return;
    }


    // ---------------------------------------------------------
    // Make sure meeting is accepted
    // ---------------------------------------------------------

    if (
      this.visitorData.acceptFlag !== 'Y'
    ) {

      this.errorMessage =
        'Your meeting has not been accepted.';

      return;
    }


    // ---------------------------------------------------------
    // Set processing state
    // ---------------------------------------------------------

    this.actionInProgress = true;

    this.processing = true;

    this.errorMessage = '';

    this.successMessage = '';


    // ---------------------------------------------------------
    // Request
    // ---------------------------------------------------------

    const request: VisitorCheckInRequest = {

      mobileNo: this.mobileNo,

      meetingId:
        this.visitorData.meetingId

    };


    console.log(
      `Automatically performing ${action}:`,
      request
    );


    // ---------------------------------------------------------
    // Call check-in/check-out API
    // ---------------------------------------------------------

    this.http.post<VisitorCheckInResponse>(
      `${environment.apiBaseUrl}/api/visitor-checkin/check-in-out`,
      request
    )
    .subscribe({

      // =======================================================
      // SUCCESS
      // =======================================================

      next: (response) => {

        this.processing = false;

        this.actionInProgress = false;


        // -----------------------------------------------------
        // Update visitor data
        // -----------------------------------------------------

        this.visitorData = response;

        this.cdr.detectChanges();

        // -----------------------------------------------------
        // Show success message
        // -----------------------------------------------------

        if (action === 'check-in') {

          this.successMessage =
            'Check-in successful. Welcome!';
          
            this.cdr.detectChanges();

        }
        else {

          this.successMessage =
            'Check-out successful. Thank you for visiting!';

          this.cdr.detectChanges();
        }


        console.log(
          `Automatic ${action} successful:`,
          response
        );

      },


      // =======================================================
      // ERROR
      // =======================================================

      error: (error) => {

        this.processing = false;

        this.actionInProgress = false;


        this.errorMessage =
          error?.error?.message ||
          `Unable to complete automatic ${action}.`;


        console.error(
          `Automatic ${action} error:`,
          error
        );

      }

    });
  }


  // =========================================================
  // STATUS HELPERS
  // =========================================================

  isNotCheckedIn(): boolean {

    if (!this.visitorData) {
      return false;
    }

    return (
      this.visitorData.acceptFlag === 'Y' &&
      !this.visitorData.entryTime &&
      !this.visitorData.exitTime
    );
  }


  isCheckedIn(): boolean {

    if (!this.visitorData) {
      return false;
    }

    return (
      this.visitorData.acceptFlag === 'Y' &&
      !!this.visitorData.entryTime &&
      !this.visitorData.exitTime
    );
  }


  isVisitCompleted(): boolean {

    if (!this.visitorData) {
      return false;
    }

    return (
      !!this.visitorData.entryTime &&
      !!this.visitorData.exitTime
    );
  }

}