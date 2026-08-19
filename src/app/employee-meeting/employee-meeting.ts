import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { environment } from '../environments/environment.service';
// import { environment } from '../../environments/environment.service';

interface Participant {
  name: string;
  email: string;
  mobileNo: string;
  organisation: string;
}

interface EmployeeMeetingRequest {
  employeeId: string;
  meetingTitle: string;
  meetingPurpose: string;
  meetingDate: string;
  meetingTime: string;
  participants: Participant[];
}

interface Visitor {
  mobileNo: string;
  firstName: string;
  lastName: string;
  address: string;
  state: string;
  district: string;
  organisation: string;
  email: string;
  photo: string;
  registrationDate: string;
}

@Component({
  selector: 'app-employee-meeting',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './employee-meeting.html',
  styleUrl: './employee-meeting.css'
})
export class EmployeeMeeting implements OnInit {

  private apiUrl = 'http://localhost:8080';


  // ==================================================
  // LOGGED-IN EMPLOYEE
  // ==================================================

  employeeId: string = '';
  employeeName: string = '';
  employeeEmail: string = '';


  // ==================================================
  // MEETING
  // ==================================================

  meetingTitle: string = '';
  meetingPurpose: string = '';
  meetingDate: string = '';
  meetingTime: string = '';

  minMeetingDate: string = '';
  minMeetingTime: string = '';


  // ==================================================
  // VISITOR MOBILE
  // ==================================================

  visitorMobile: string = '';

  searchingVisitor: boolean = false;

  visitorFound: boolean = false;

  visitorNotFound: boolean = false;

  visitorSearched: boolean = false;

  visitorError: string = '';


  // ==================================================
  // CURRENT VISITOR DETAILS
  // ==================================================

  visitorFirstName: string = '';
  visitorLastName: string = '';
  visitorEmail: string = '';

  visitorAddress: string = '';
  visitorState: string = '';
  visitorDistrict: string = '';
  visitorOrganisation: string = '';
  visitorPhoto: string = '';


  // ==================================================
  // ORIGINAL VISITOR DETAILS
  //
  // Used to determine whether an existing visitor
  // has been modified.
  // ==================================================

  originalVisitor: Visitor | null = null;


  // ==================================================
  // PARTICIPANTS
  // ==================================================

  participants: Participant[] = [];


  // ==================================================
  // UI STATE
  // ==================================================

  saving: boolean = false;

  updatingVisitor: boolean = false;


  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}


  // ==================================================
  // INIT
  // ==================================================

  ngOnInit(): void {

    this.employeeId =
      sessionStorage.getItem('employeeId') || '';

    this.employeeName =
      sessionStorage.getItem('employeeName') || 'Employee';

    this.employeeEmail =
      sessionStorage.getItem('employeeEmail') || '';


    const today = new Date();

    this.minMeetingDate =
      this.formatDateForInput(today);

      // ==========================================
  // CURRENT TIME
  // ==========================================

  this.updateMinMeetingTime();
  }


  // ==================================================
  // MOBILE NUMBER INPUT
  //
  // Automatically searches when exactly 10 digits
  // are entered.
  // ==================================================

  onVisitorMobileChange(): void {

    // Keep only numbers
    this.visitorMobile =
      this.visitorMobile.replace(/\D/g, '').slice(0, 10);


    // ------------------------------------------
    // If less than 10 digits
    // ------------------------------------------

    if (this.visitorMobile.length < 10) {

      this.visitorSearched = false;

      this.visitorFound = false;

      this.visitorNotFound = false;

      this.visitorError = '';

      this.originalVisitor = null;

      this.clearVisitorDetails();

      return;
    }


    // ------------------------------------------
    // Exactly 10 digits
    // ------------------------------------------

    if (this.visitorMobile.length === 10) {

      this.searchVisitor();

    }
  }


  // ==================================================
  // SEARCH VISITOR
  // ==================================================

  searchVisitor(): void {

    const mobileNo =
      this.visitorMobile.trim();


    if (mobileNo.length !== 10) {
      return;
    }


    // Prevent duplicate request while searching
    if (this.searchingVisitor) {
      return;
    }


    // ==========================================
    // START SEARCH
    // ==========================================

    this.searchingVisitor = true;

    this.visitorSearched = true;

    this.visitorFound = false;

    this.visitorNotFound = false;

    this.visitorError = '';

    this.originalVisitor = null;


    // ==========================================
    // GET VISITOR
    // ==========================================

    this.http.get<Visitor>(
      `${this.apiUrl}/api/visitors/${mobileNo}`
    )
    .pipe(

      finalize(() => {

        this.searchingVisitor = false;

        this.cdr.detectChanges();

      })

    )
    .subscribe({

      // ========================================
      // VISITOR FOUND
      // ========================================

      next: (visitor) => {

        console.log(
          'Visitor found:',
          visitor
        );


        this.visitorFound = true;

        this.visitorNotFound = false;


        // --------------------------------------
        // Populate form
        // --------------------------------------

        this.visitorMobile =
          visitor.mobileNo || mobileNo;

        this.visitorFirstName =
          visitor.firstName || '';

        this.visitorLastName =
          visitor.lastName || '';

        this.visitorEmail =
          visitor.email || '';

        this.visitorAddress =
          visitor.address || '';

        this.visitorState =
          visitor.state || '';

        this.visitorDistrict =
          visitor.district || '';

        this.visitorOrganisation =
          visitor.organisation || '';

        this.visitorPhoto =
          visitor.photo || '';


        // --------------------------------------
        // Store original values
        // --------------------------------------

        this.originalVisitor = {

          mobileNo:
            visitor.mobileNo || mobileNo,

          firstName:
            visitor.firstName || '',

          lastName:
            visitor.lastName || '',

          email:
            visitor.email || '',

          address:
            visitor.address || '',

          state:
            visitor.state || '',

          district:
            visitor.district || '',

          organisation:
            visitor.organisation || '',

          photo:
            visitor.photo || '',

          registrationDate:
            visitor.registrationDate || ''

        };


        this.cdr.detectChanges();

      },


      // ========================================
      // VISITOR NOT FOUND
      // ========================================

      error: (error) => {

        console.error(
          'Visitor search error:',
          error
        );


        if (error.status === 404) {

          this.visitorFound = false;

          this.visitorNotFound = true;

          this.originalVisitor = null;

          this.clearVisitorDetails();

          // Keep mobile number
          this.visitorMobile = mobileNo;


          this.cdr.detectChanges();

          return;
        }


        this.visitorError =
          'Unable to search visitor. Please try again.';

      }

    });
  }


  // ==================================================
  // CHECK WHETHER EXISTING VISITOR WAS CHANGED
  // ==================================================

  hasVisitorChanges(): boolean {

    if (!this.originalVisitor) {
      return false;
    }


    return (

      this.visitorFirstName.trim() !==
      (this.originalVisitor.firstName || '').trim()

      ||

      this.visitorLastName.trim() !==
      (this.originalVisitor.lastName || '').trim()

      ||

      this.visitorEmail.trim() !==
      (this.originalVisitor.email || '').trim()

      ||

      this.visitorAddress.trim() !==
      (this.originalVisitor.address || '').trim()

      ||

      this.visitorState.trim() !==
      (this.originalVisitor.state || '').trim()

      ||

      this.visitorDistrict.trim() !==
      (this.originalVisitor.district || '').trim()

      ||

      this.visitorOrganisation.trim() !==
      (this.originalVisitor.organisation || '').trim()

      ||

      this.visitorPhoto !==
      (this.originalVisitor.photo || '')
    );
  }


  // ==================================================
  // ADD EXISTING VISITOR WITHOUT UPDATE
  // ==================================================

  addExistingVisitor(): void {

    if (!this.visitorFirstName.trim()) {

      alert(
        'Visitor name is missing.'
      );

      return;
    }


    const visitor: Visitor = {

      mobileNo:
        this.visitorMobile.trim(),

      firstName:
        this.visitorFirstName.trim(),

      lastName:
        this.visitorLastName.trim(),

      email:
        this.visitorEmail.trim(),

      address:
        this.visitorAddress.trim(),

      state:
        this.visitorState.trim(),

      district:
        this.visitorDistrict.trim(),

      organisation:
        this.visitorOrganisation.trim(),

      photo:
        this.visitorPhoto,

      registrationDate:
        this.originalVisitor?.registrationDate || ''

    };


    this.addVisitorToParticipants(visitor);


    this.resetVisitorForm();

  }


  // ==================================================
  // UPDATE EXISTING VISITOR
  // ==================================================

  updateExistingVisitor(): void {

    const mobileNo =
      this.visitorMobile.trim();


    if (mobileNo.length !== 10) {

      alert(
        'Please enter a valid 10 digit mobile number.'
      );

      return;
    }


    // ==========================================
    // VALIDATION
    // ==========================================

    if (!this.visitorFirstName.trim()) {

      alert(
        'Please enter visitor first name.'
      );

      return;
    }


    if (!this.visitorAddress.trim()) {

      alert(
        'Please enter visitor address.'
      );

      return;
    }


    if (!this.visitorState.trim()) {

      alert(
        'Please enter visitor state.'
      );

      return;
    }


    if (!this.visitorDistrict.trim()) {

      alert(
        'Please enter visitor district.'
      );

      return;
    }


    // ==========================================
    // PAYLOAD
    // ==========================================

    const visitorData: Visitor = {

      mobileNo: mobileNo,

      firstName:
        this.visitorFirstName.trim(),

      lastName:
        this.visitorLastName.trim(),

      email:
        this.visitorEmail.trim(),

      address:
        this.visitorAddress.trim(),

      state:
        this.visitorState.trim(),

      district:
        this.visitorDistrict.trim(),

      organisation:
        this.visitorOrganisation.trim(),

      photo:
        this.visitorPhoto,

      registrationDate:
        this.originalVisitor?.registrationDate || ''

    };


    console.log(
      'Updating visitor:',
      visitorData
    );


    this.updatingVisitor = true;


    this.http.put<Visitor>(
      `${this.apiUrl}/api/visitors/${mobileNo}`,
      visitorData
    )
    .pipe(

      finalize(() => {

        this.updatingVisitor = false;

        this.cdr.detectChanges();

      })

    )
    .subscribe({

      next: (visitor) => {

        console.log(
          'Visitor updated:',
          visitor
        );


        this.addVisitorToParticipants(visitor);


        this.resetVisitorForm();

      },


      error: (error) => {

        console.error(
          'Update visitor error:',
          error
        );


        alert(
          error.error?.message ||
          'Unable to update visitor.'
        );

      }

    });
  }


  // ==================================================
  // CREATE NEW VISITOR
  // ==================================================

  saveNewVisitor(): void {

    const mobileNo =
      this.visitorMobile.trim();


    // ==========================================
    // VALIDATION
    // ==========================================

    if (mobileNo.length !== 10) {

      alert(
        'Please enter a valid 10 digit mobile number.'
      );

      return;
    }


    if (!this.visitorFirstName.trim()) {

      alert(
        'Please enter visitor first name.'
      );

      return;
    }

    if (!this.visitorEmail) {

      alert(
        'Please enter participant email.'
      );

      return;
    }


    const emailPattern =
      /^[^\s@]+@[^\s@]+\.(com|in)$/i;


    if (!emailPattern.test(this.visitorEmail)) {

      alert(
        'Please enter a valid email'
      );

      return;
    }


    // if (!this.visitorAddress.trim()) {

    //   alert(
    //     'Please enter visitor address.'
    //   );

    //   return;
    // }


    // if (!this.visitorState.trim()) {

    //   alert(
    //     'Please enter visitor state.'
    //   );

    //   return;
    // }


    // if (!this.visitorDistrict.trim()) {

    //   alert(
    //     'Please enter visitor district.'
    //   );

    //   return;
    // }


    // ==========================================
    // PAYLOAD
    // ==========================================

    const visitorData: Visitor = {

      mobileNo: mobileNo,

      firstName:
        this.visitorFirstName.trim(),

      lastName:
        this.visitorLastName.trim(),

      email:
        this.visitorEmail.trim(),

      address:
        this.visitorAddress.trim(),

      state:
        this.visitorState.trim(),

      district:
        this.visitorDistrict.trim(),

      organisation:
        this.visitorOrganisation.trim(),

      photo:
        this.visitorPhoto,

      registrationDate:
        new Date()
          .toISOString()
          .split('T')[0]

    };


    console.log(
      'Creating new visitor:',
      visitorData
    );


    this.updatingVisitor = true;


    this.http.post<Visitor>(
      `${this.apiUrl}/api/visitors`,
      visitorData
    )
    .pipe(

      finalize(() => {

        this.updatingVisitor = false;

        this.cdr.detectChanges();

      })

    )
    .subscribe({

      next: (visitor) => {

        console.log(
          'New visitor created:',
          visitor
        );


        this.addVisitorToParticipants(visitor);


        this.resetVisitorForm();

      },


      error: (error) => {

        console.error(
          'Create visitor error:',
          error
        );


        alert(
          error.error?.message ||
          'Unable to create visitor.'
        );

      }

    });
  }


  // ==================================================
  // ADD VISITOR TO PARTICIPANTS
  // ==================================================

  addVisitorToParticipants(
    visitor: Visitor
  ): void {

    const mobileNo =
      visitor.mobileNo.trim();


    // ==========================================
    // DUPLICATE MOBILE
    // ==========================================

    const duplicate =
      this.participants.some(
        participant =>
          participant.mobileNo === mobileNo
      );


    if (duplicate) {

      alert(
        'This visitor has already been added to the meeting.'
      );

      return;
    }


    // ==========================================
    // ADD
    // ==========================================

    const fullName =
      `${visitor.firstName || ''} ${visitor.lastName || ''}`
        .trim();


    this.participants.push({

      name:
        fullName || 'Visitor',

      email:
        visitor.email || '',

      mobileNo:
        mobileNo,
      
      organisation:
        visitor.organisation || ''

    });


    console.log(
      'Participants:',
      this.participants
    );

  }


  // ==================================================
  // REMOVE PARTICIPANT
  // ==================================================

  removeParticipant(index: number): void {

    this.participants.splice(index, 1);

  }


  // ==================================================
  // CLEAR PARTICIPANTS
  // ==================================================

  clearParticipants(): void {

    this.participants = [];

  }


  // ==================================================
  // CLEAR VISITOR DETAILS
  // ==================================================

  clearVisitorDetails(): void {

    this.visitorFirstName = '';

    this.visitorLastName = '';

    this.visitorEmail = '';

    this.visitorAddress = '';

    this.visitorState = '';

    this.visitorDistrict = '';

    this.visitorOrganisation = '';

    this.visitorPhoto = '';

  }


  // ==================================================
  // RESET VISITOR SEARCH
  // ==================================================

  resetVisitorForm(): void {

    this.visitorMobile = '';

    this.clearVisitorDetails();

    this.visitorFound = false;

    this.visitorNotFound = false;

    this.visitorSearched = false;

    this.visitorError = '';

    this.originalVisitor = null;

  }


  // ==================================================
  // RESET COMPLETE MEETING
  // ==================================================

  resetMeetingForm(): void {

    this.meetingTitle = '';

    this.meetingDate = '';

    this.meetingTime = '';

    this.resetVisitorForm();

    this.participants = [];

  }


  // ==================================================
  // SCHEDULE MEETING
  // ==================================================

  scheduleMeeting(): void {

    if (!this.employeeId) {

      alert(
        'Employee session has expired. Please login again.'
      );

      return;
    }


    if (!this.meetingTitle.trim()) {

      alert(
        'Please enter the meeting title.'
      );

      return;
    }


    if (!this.meetingPurpose) {

      alert(
        'Please enter the meeting purpose.'
      );

      return;
    }

    if (!this.meetingDate) {

      alert(
        'Please select the meeting date.'
      );

      return;
    }


    if (!this.meetingTime) {

      alert(
        'Please select the meeting time.'
      );

      return;
    }


    if (this.participants.length === 0) {

      alert(
        'Please add at least one participant.'
      );

      return;
    }


    const meetingDateTime =
      new Date(
        `${this.meetingDate}T${this.meetingTime}`
      );

    const currentDateTime =
      new Date();


    if (meetingDateTime <= currentDateTime) {

      alert(
        'Meeting date and time must be in the future.'
      );

      return;
    }


    const meetingData:
      EmployeeMeetingRequest = {

      employeeId:
        this.employeeId,

      meetingTitle:
        this.meetingTitle.trim(),

      meetingPurpose:
        this.meetingPurpose,

      meetingDate:
        this.meetingDate,

      meetingTime:
        this.meetingTime,

      participants:
        this.participants

    };


    console.log(
      'Employee Meeting Payload:',
      meetingData
    );


    this.saving = true;


    this.http.post<any>(
      `${environment.apiBaseUrl}/api/employee-meetings`,
      meetingData
    )
    .pipe(

      finalize(() => {

        this.saving = false;

        this.cdr.detectChanges();

      })

    )
    .subscribe({

      next: (response) => {

        if (response.success) {

          alert(
            response.message ||
            'Meeting scheduled successfully.'
          );

          this.resetMeetingForm();

          window.location.reload();

        } else {

          alert(
            response.message ||
            'Unable to schedule meeting.'
          );

        }

      },

      error: (error) => {

        console.error(
          'Schedule meeting error:',
          error
        );

        alert(
          error.error?.message ||
          'Unable to schedule meeting. Please try again.'
        );

      }

    });
  }

  // ==================================================
// FORMAT DATE FOR HTML DATE INPUT
// ==================================================

private formatDateForInput(date: Date): string {

  const year = date.getFullYear();

  const month =
    String(date.getMonth() + 1).padStart(2, '0');

  const day =
    String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// ==================================================
// GET CURRENT TIME FOR HTML TIME INPUT
// ==================================================

private updateMinMeetingTime(): void {

  const now = new Date();

  const hours =
    String(now.getHours()).padStart(2, '0');

  const minutes =
    String(now.getMinutes()).padStart(2, '0');

  this.minMeetingTime =
    `${hours}:${minutes}`;
}

// ==================================================
// MEETING DATE CHANGED
// ==================================================

onMeetingDateChange(): void {

  // ------------------------------------------
  // Update current minimum time
  // ------------------------------------------

  this.updateMinMeetingTime();


  // ------------------------------------------
  // If selected date is today,
  // prevent selecting earlier time
  // ------------------------------------------

  if (
    this.meetingDate ===
    this.minMeetingDate
  ) {

    if (
      this.meetingTime &&
      this.meetingTime < this.minMeetingTime
    ) {

      this.meetingTime = '';

    }

    return;
  }


  // ------------------------------------------
  // Future date
  // ------------------------------------------

  this.minMeetingTime = '00:00';
}

}