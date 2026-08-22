import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { State } from 'country-state-city';
import type { IState } from 'country-state-city';
import { AdminService } from '../services/admin.service';
import { MeetingService } from '../services/meeting';
import { of } from 'rxjs';
import { timeout, catchError, finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { environment } from '../environments/environment.service';

// Converts 12-hour hour + AM/PM into 24-hour "HH" string.
function to24Hour(hour12: string, period: string): string {
  let h = parseInt(hour12, 10);
  if (period === 'AM') {
    if (h === 12) h = 0;
  } else {
    if (h !== 12) h += 12;
  }
  return String(h).padStart(2, '0');
}

interface StateDistrict {
  state: string;
  districts: string[];
}

// Group-level validator: checks the combined date + hour + minute + period against "now"
// and attaches the error to the minute control (so it shows under the time selects).
function futureDateTimeGroupValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const dateCtrl = group.get('proposedMeetDate');
    const hourCtrl = group.get('meetHour');
    const minuteCtrl = group.get('meetMinute');
    const periodCtrl = group.get('meetPeriod');
    if (!dateCtrl || !hourCtrl || !minuteCtrl || !periodCtrl) return null;

    const date = dateCtrl.value;
    const hour12 = hourCtrl.value;
    const minute = minuteCtrl.value;
    const period = periodCtrl.value;
    if (!date || !hour12 || !minute || !period) return null;

    const hour24 = to24Hour(hour12, period);
    const selected = new Date(`${date}T${hour24}:${minute}`);
    const isPast = selected.getTime() < Date.now();

    const existingErrors = minuteCtrl.errors || {};
    if (isPast) {
      minuteCtrl.setErrors({ ...existingErrors, pastDate: true });
      return { pastDate: true };
    } else if (existingErrors['pastDate']) {
      const { pastDate, ...rest } = existingErrors;
      minuteCtrl.setErrors(Object.keys(rest).length ? rest : null);
    }
    return null;
  };
}

@Component({
  selector: 'app-visitor-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './visitor-form.html',
  styleUrls: ['./visitor-form.css']
})
export class VisitorForm implements OnInit {

  @ViewChild('video') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  visitorForm: FormGroup;
  photoDataUrl: string | null = null;
  cameraActive = false;
  cameraError: string | null = null;
  cameraOpening = false;
  submitError: string | null = null;
  submitting = false;
  submitLoadingMessage = '';
  checkingMobile = false;
  submittedOnce = false;

  isUpdateMode = false;
  visitorExists = false;

  checkInOutLoading = false;
  loading = false;

checkInOutMeeting: any = null;

checkInOutStatus:
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'NOT_AVAILABLE'
  | 'ALREADY_CHECKED_OUT'
  | null = null;

  mobileLookupInProgress = false;
  mobileLookupCompleted = false;

  private stream: MediaStream | null = null;

  private readonly countryCode = 'IN';
  private readonly apiUrl = `${environment.apiBaseUrl}/api/visitors`;

  states: IState[] = [];
districts: string[] = [];
locationData: StateDistrict[] = [];

  sections: any[] = [];
  employees: any[] = [];
  filteredEmployees: any[] = [];

  // Options for the custom time selects (12-hour format + AM/PM, since native
  // <input type="time"> has no clickable popup in Firefox).
  hours: string[] = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  minutes: string[] = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
  periods: string[] = ['AM', 'PM'];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private adminService: AdminService,
    private meetingService: MeetingService,
    private cdr: ChangeDetectorRef
  ) {
    this.states = State.getStatesOfCountry(this.countryCode);

    const todayStr = new Date().toISOString().substring(0, 10);

    this.visitorForm = this.fb.group({
      mobileNo: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      firstName: ['', [Validators.required, Validators.maxLength(15)]],
      lastName: ['', [Validators.maxLength(20)]],
      email: ['', [Validators.email, Validators.maxLength(50)]],
      state: ['', Validators.required],
      district: ['', Validators.required],
      organisation: ['', [Validators.maxLength(50)]],
      organisationAddress: ['', [Validators.maxLength(60)]],
      designation: ['', [Validators.maxLength(20)]],
      department: ['', Validators.required],
      // Default mode of visit is "Unit" (Visit) and locked — not user-editable
      modeOfVisit: [{ value: 'Unit', disabled: true }, Validators.required],
      meetPersonName: ['', Validators.required],
      purposeOfVisit: [{ value: 'offical' }, [Validators.required, Validators.maxLength(30)]],
      descriptionOfVisit: '',
      // Split into a native date input + two <select> dropdowns for hour/minute
      // (fixes Firefox not showing any clickable time-selection UI).
      proposedMeetDate: ['', Validators.required],
      meetHour: ['', Validators.required],
      meetMinute: ['', Validators.required],
      meetPeriod: ['AM', Validators.required],
      registrationDate: [{ value: todayStr, disabled: true }],
      photo: [null]
    }, { validators: futureDateTimeGroupValidator() });

    this.visitorForm.get('state')?.valueChanges.subscribe((stateCode: string) => {

  this.districts = [];

  if (!this.checkingMobile) {
    this.visitorForm.get('district')?.setValue('');
  }

  if (!stateCode) {
    return;
  }

  const selectedState = this.states.find(
    state => state.isoCode === stateCode
  );

  if (!selectedState) {
    return;
  }

  const stateData = this.locationData.find(
    item => item.state === selectedState.name
  );

  if (stateData) {
    this.districts = stateData.districts;
  }

});

    this.visitorForm.get('department')?.valueChanges.subscribe((sectionId: string) => {
      this.filteredEmployees = sectionId
        ? this.employees.filter(e => e.sectionId === sectionId)
        : [];
      if (!this.checkingMobile) {
        this.visitorForm.get('meetPersonName')?.setValue('');
      }
    });
  }

  loadLocationData(): void {
  this.http.get<StateDistrict[]>('/assets/location-data.json')
    .subscribe({
      next: (data) => {
        this.locationData = data;

        console.log('Location data loaded:', this.locationData);
      },
      error: (error) => {
        console.error('Failed to load location data:', error);
      }
    });
}

  ngOnInit(): void {
    this.loadSections();
    this.loadEmployees();
    this.loadLocationData();
  }

  get f() {
    return this.visitorForm.controls;
  }

  get mobileVerified(): boolean {
    return this.f['mobileNo'].valid;
  }

  get photoError(): boolean {
    return this.submittedOnce && !this.photoDataUrl;
  }

  get selectedMeetingPersonName(): string {
    const id = this.f['meetPersonName'].value;
    const emp = this.filteredEmployees.find(e => e.employeeId === id);
    return emp ? `${emp.firstName} ${emp.lastName ?? ''}`.trim() : '';
  }

  // Min selectable date = today (for the date input's [attr.min])
  get minDate(): string {
    const now = new Date();
    const tzOffsetMs = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffsetMs).toISOString().slice(0, 10);
  }

  // ---------- load sections & employees ----------

  loadSections(): void {
    this.adminService.getAllSections().subscribe({
      next: (res: any) => { this.sections = res; },
      error: (err) => { console.error(err); }
    });
  }

  loadEmployees(): void {
    this.adminService.getAllEmployees().subscribe({
      next: (res: any) => {
        this.employees = res;
        const sectionId = this.f['department'].value;
        this.filteredEmployees = sectionId
          ? this.employees.filter(e => e.sectionId === sectionId)
          : [];
      },
      error: (err) => { console.error(err); }
    });
  }

  // ---------- mobile number: digits-only + existing-visitor lookup ----------

  onMobileInput(event: Event): void {

  const input = event.target as HTMLInputElement;

  const mobileNo =
    input.value.replace(/\D/g, '').slice(0, 10);

  input.value = mobileNo;

  this.f['mobileNo'].setValue(mobileNo, {
    emitEvent: false
  });

  // User is entering/changing a number,
  // so the previous visitor result is no longer valid.
  this.mobileLookupCompleted = false;
  this.visitorExists = false;
  this.isUpdateMode = false;

  if (mobileNo.length === 10) {
    this.onMobileBlur();
  }
}

  onMobileBlur(): void {

  const mobileNo =
    this.visitorForm.get('mobileNo')?.value?.trim();

  if (!mobileNo || mobileNo.length !== 10) {
    return;
  }

  // Already checked this exact number
  if (this.mobileLookupCompleted) {
    return;
  }

  // Request already running
  if (this.mobileLookupInProgress) {
    return;
  }

  this.mobileLookupInProgress = true;
  this.loading = true;

  this.http.get<any>(
    `${this.apiUrl}/${mobileNo}`
  ).subscribe({

    // =====================================================
    // EXISTING VISITOR
    // =====================================================

    next: (visitor) => {

      this.mobileLookupInProgress = false;
      this.loading = false;

      this.mobileLookupCompleted = true;

      // IMPORTANT
      this.visitorExists = true;
      this.isUpdateMode = true;

      console.log(
        'Existing visitor found:',
        visitor
      );

      this.visitorForm.patchValue({

        firstName:
          visitor.firstName || '',

        lastName:
          visitor.lastName || '',

        address:
          visitor.address || '',

        state:
          visitor.state || '',

        district:
          visitor.district || '',

        organisation:
          visitor.organisation || '',

        email:
          visitor.email || '',

        designation:
          visitor.designation || '',

        purposeOfVisit:
          visitor.purposeOfVisit || '',

        modeOfVisit:
          visitor.modeOfVisit || '',

        descriptionOfVisit:
          visitor.descriptionOfVisit || ''

      });

      // Check today's meeting
      this.checkVisitorMeeting(mobileNo);
    },


    // =====================================================
    // VISITOR NOT FOUND
    // =====================================================

    error: (error) => {

      this.mobileLookupInProgress = false;
      this.loading = false;

      // IMPORTANT
      this.mobileLookupCompleted = true;

      // This is a NEW visitor
      this.visitorExists = false;
      this.isUpdateMode = false;

      console.log(
        'Visitor lookup response:',
        error
      );

      const message =
        error?.error?.message ||
        error?.error?.error ||
        '';

      const lowerMessage =
        String(message).toLowerCase();

      const visitorNotFound =
        error?.status === 404 ||
        error?.status === 400 ||
        lowerMessage.includes('visitor not found') ||
        lowerMessage.includes('no visitor');

      if (visitorNotFound) {

        Swal.fire({
          icon: 'info',
          title: 'New Visitor',
          text:
            'No visitor is registered with this mobile number. You can continue with a new registration.',
          confirmButtonText: 'OK'
        });

        return;
      }

      // Swal.fire({
      //   icon: 'error',
      //   title: 'Unable to Load Visitor',
      //   text:
      //     message ||
      //     'Unable to retrieve visitor details.',
      //   confirmButtonText: 'OK'
      // });
    }

  });
}
  // ---------- Live selfie capture ----------

  onAvatarClick(): void {

    if (this.cameraOpening || this.cameraActive) {
      return;
    }

    if (this.photoDataUrl) {
      this.retakeSelfie();
      return;
    }

    this.startCamera();
  }

  async startCamera(): Promise<void> {

  // Prevent multiple camera initialization attempts
  if (this.cameraOpening || this.cameraActive) {
    return;
  }

  console.log('📷 Starting camera...');

  this.cameraOpening = true;
  this.cameraError = null;

  // IMPORTANT:
  // Open the modal BEFORE requesting the camera.
  this.cameraActive = true;

  // Force Angular to render the modal and <video>
  this.cdr.detectChanges();

  try {

    // Stop any previous stream directly.
    // Do NOT call stopCamera() here because it sets
    // cameraActive = false.
    if (this.stream) {

      this.stream
        .getTracks()
        .forEach(track => track.stop());

      this.stream = null;
    }

    console.log('📷 Requesting webcam...');

    const stream =
      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user'
        },
        audio: false
      });

    console.log('📷 Webcam stream received:', stream);

    this.stream = stream;

    // Make sure Angular has the video element
    this.cdr.detectChanges();

    // Give Angular a render cycle
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => resolve());
    });

    const video =
      this.videoRef?.nativeElement;

    if (!video) {
      throw new Error(
        'Video element was not found.'
      );
    }

    console.log('📷 Video element found');

    video.srcObject = stream;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;

    // Start playback
    await video.play();

    console.log('✅ Camera preview started');

  } catch (error: any) {

    console.error(
      '❌ Camera initialization failed:',
      error
    );

    this.cameraActive = false;

    if (this.stream) {

      this.stream
        .getTracks()
        .forEach(track => track.stop());

      this.stream = null;
    }

    if (error?.name === 'NotAllowedError') {

      this.cameraError =
        'Camera permission was denied. Please allow camera access in your browser.';

    } else if (error?.name === 'NotFoundError') {

      this.cameraError =
        'No camera was found. Please check your Logitech webcam.';

    } else if (error?.name === 'NotReadableError') {

      this.cameraError =
        'The camera is already being used by another application.';

    } else {

      this.cameraError =
        'Unable to open the camera. Please try again.';
    }

  } finally {

    this.cameraOpening = false;

    this.cdr.detectChanges();
  }
}

  captureSelfie(): void {

    const video = this.videoRef?.nativeElement;
    const canvas = this.canvasRef?.nativeElement;

    if (!video || !canvas) {

      console.error('Video or canvas element not found.');

      return;

    }

    // Make sure the camera actually has video dimensions
    if (
      video.readyState < 2 ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {

      this.cameraError =
        'Camera preview is not ready yet. Please try again.';

      return;

    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');

    if (!ctx) {

      this.cameraError = 'Unable to capture photo.';

      return;

    }

    ctx.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    this.photoDataUrl =
      canvas.toDataURL('image/jpeg', 0.9);

    this.visitorForm.patchValue({
      photo: this.photoDataUrl
    });

    this.stopCamera();

  }

  retakeSelfie() {
    this.photoDataUrl = null;
    this.visitorForm.patchValue({ photo: null });
    this.startCamera();
  }

  stopCamera(): void {

    if (this.stream) {

      this.stream
        .getTracks()
        .forEach(track => {
          track.stop();
        });

      this.stream = null;
    }

    const video =
      this.videoRef?.nativeElement;

    if (video) {
      video.pause();
      video.srcObject = null;
    }

    this.cameraActive = false;
  }

  // ---------- Form actions ----------

  onSubmit(): void {

  this.submitError = null;
  this.submittedOnce = true;

  if (!this.visitorForm.valid) {
    this.visitorForm.markAllAsTouched();

    Swal.fire({
      icon: 'warning',
      title: 'Incomplete Form',
      text: 'Please fill in all required fields.',
      confirmButtonText: 'OK'
    });

    return;
  }

  const raw = this.visitorForm.getRawValue();

  const hour24 = to24Hour(raw.meetHour, raw.meetPeriod);

  const proposedMeetTime =
    `${hour24}:${raw.meetMinute}`;

  const proposedMeetDateTime =
    `${raw.proposedMeetDate}T${proposedMeetTime}`;

  const selectedSection =
    this.sections.find(
      s => s.sectionId === raw.department
    );

  const selectedEmployee =
    this.employees.find(
      e => e.employeeId === raw.meetPersonName
    );

  const payload = {
    mobileNo: raw.mobileNo,
    firstName: raw.firstName,
    lastName: raw.lastName,
    state: raw.state,
    district: raw.district,
    organisation: raw.organisation,
    address: raw.organisationAddress,
    email: raw.email,
    designation: raw.designation,
    department: raw.department,
    departmentName: selectedSection
      ? selectedSection.sectionName
      : '',
    modeOfVisit: raw.modeOfVisit,
    meetPersonName: raw.meetPersonName,
    meetPersonDisplayName: selectedEmployee
      ? `${selectedEmployee.firstName} ${selectedEmployee.lastName ?? ''}`.trim()
      : '',
    purposeOfVisit: raw.purposeOfVisit,
    descriptionOfVisit: raw.descriptionOfVisit,
    proposedMeetDateTime,
    photoDataUrl: this.photoDataUrl
  };

  // =========================================
  // START LOADER
  // =========================================

  this.submitting = true;
  this.submitLoadingMessage =
    this.isUpdateMode
      ? 'Updating visitor details...'
      : 'Saving visitor details...';


  const request$ = this.visitorExists
  ? this.http.put(
      `${this.apiUrl}/${raw.mobileNo}`,
      payload
    )
  : this.http.post(
      this.apiUrl,
      payload
    );

    console.log('========== VISITOR SAVE ==========');
  console.log('Mobile:', raw.mobileNo);
  console.log('Visitor exists:', this.visitorExists);
  console.log('Update mode:', this.isUpdateMode);
  console.log('Request type:', this.visitorExists ? 'PUT' : 'POST');
  console.log('Payload:', payload);
  console.log('===================================');


  // =========================================
  // API 1 - VISITOR
  // =========================================

  request$.subscribe({

    next: () => {

      // DO NOT set submitting = false here.

      // Change loader message for API 2
      this.submitLoadingMessage =
        'Creating meeting request...';

      // Start API 2
      this.createMeetingRequest(raw);
    },

    error: (err) => {

      this.submitting = false;

      const message =
        err?.error?.message ||
        'Failed to save visitor details. Please try again.';

      this.submitError = message;

      Swal.fire({
        icon: 'error',
        title: 'Unable to Save',
        text: message,
        confirmButtonText: 'OK'
      });
    }

  });
}

  resetForm() {

  const todayStr =
    new Date().toISOString().substring(0, 10);

  this.visitorForm.reset({
    registrationDate: todayStr,
    modeOfVisit: {
      value: 'Unit',
      disabled: true
    }
  });

  this.photoDataUrl = null;
  this.districts = [];
  this.filteredEmployees = [];

  this.isUpdateMode = false;
  this.visitorExists = false;

  this.mobileLookupCompleted = false;
  this.mobileLookupInProgress = false;

  this.checkInOutMeeting = null;
  this.checkInOutStatus = null;

  this.submittedOnce = false;

  this.stopCamera();
}

  private createMeetingRequest(raw: any): void {

  const proposedMeetTime =
    (raw.meetHour &&
     raw.meetMinute &&
     raw.meetPeriod)
      ? `${to24Hour(raw.meetHour, raw.meetPeriod)}:${raw.meetMinute}`
      : null;

  const meetingPayload = {
    mobileNo: raw.mobileNo,
    hostId: raw.meetPersonName,
    requestedMeetingDate:
      raw.proposedMeetDate || null,
    requestedMeetingTime:
      proposedMeetTime
        ? `${proposedMeetTime}:00`
        : null
  };

  this.meetingService
    .createMeeting(meetingPayload)
    .subscribe({

      // =========================================
      // API 2 SUCCESS
      // =========================================

      next: () => {

        // BOTH APIs are now complete
        this.submitting = false;
        this.submitLoadingMessage = '';

        Swal.fire({
          icon: 'success',
          title: this.isUpdateMode
            ? 'Successful'
            : 'Successful',

          text:
            'Visitor details have been saved and the meeting request has been sent to the host.',

          confirmButtonText: 'OK',
          confirmButtonColor: '#16a34a'

        }).then(() => {

          this.resetForm();

        });
      },


      // =========================================
      // API 2 ERROR
      // =========================================

      error: (err) => {

        this.submitting = false;
        this.submitLoadingMessage = '';

        const message =
          err?.error?.message ||
          'Visitor was saved, but the meeting request could not be created.';

        this.submitError = message;

        Swal.fire({
          icon: 'error',
          title: 'Meeting Request Failed',
          text: message,
          confirmButtonText: 'OK'
        });
      }

    });
}

checkVisitorMeeting(mobileNo: string): void {

  // Prevent duplicate calls
  if (this.checkInOutLoading) {
    return;
  }

  this.checkInOutLoading = true;

  this.http.get<any>(
    `${environment.apiBaseUrl}/api/visitor-checkin/search/${mobileNo}`
  )
  .subscribe({

    next: (response) => {

  this.checkInOutLoading = false;

  console.log('CHECK-IN/OUT API RESPONSE:', response);
  console.log('APPROVED MEETING TIME:', response.approvedMeetingTime);
  console.log(
    'APPROVED MEETING TIME TYPE:',
    typeof response.approvedMeetingTime
  );

  this.checkInOutMeeting = response;

  this.determineCheckInOutStatus(response);
},

    error: (error) => {

      this.checkInOutLoading = false;

      this.checkInOutMeeting = null;
      this.checkInOutStatus = 'NOT_AVAILABLE';

      console.log(
        'No check-in/check-out meeting:',
        error
      );

      // IMPORTANT:
      // DO NOT show "New Visitor" here.
      //
      // Visitor already exists.
      // It simply means there is no accepted meeting
      // available for check-in/check-out today.

      return;
    }

  });

}

determineCheckInOutStatus(response: any): void {

  // =====================================================
  // 1. ALREADY CHECKED OUT
  // =====================================================

  if (response.entryTime && response.exitTime) {

    this.checkInOutStatus = 'ALREADY_CHECKED_OUT';

    Swal.fire({
      icon: 'info',
      title: 'Already Checked Out',
      text: `This visitor has already checked out at ${this.formatTime(response.exitTime)}.`,
      confirmButtonText: 'OK'
    });

    return;
  }


  // =====================================================
  // 2. ALREADY CHECKED IN
  // =====================================================

  if (response.entryTime && !response.exitTime) {

    this.checkInOutStatus = 'CHECK_OUT';

    this.checkIfCheckoutAllowed(response);

    return;
  }


  // =====================================================
  // 3. NOT CHECKED IN
  // =====================================================

  if (!response.entryTime) {

    const approvedTime = this.parseTime(
      response.approvedMeetingTime
    );

    if (!approvedTime) {

      this.checkInOutStatus = 'NOT_AVAILABLE';

      Swal.fire({
        icon: 'warning',
        title: 'Meeting Time Unavailable',
        text: 'Unable to determine the approved meeting time.',
        confirmButtonText: 'OK'
      });

      return;
    }


    // ===================================================
    // CURRENT TIME
    // ===================================================

    const now = new Date();

    const currentMinutes =
      now.getHours() * 60 +
      now.getMinutes();


    // ===================================================
    // APPROVED TIME
    // ===================================================

    const approvedMinutes =
      approvedTime.hours * 60 +
      approvedTime.minutes;


    // ===================================================
    // CHECK-IN START TIME
    // 15 MINUTES BEFORE APPROVED TIME
    // ===================================================

    const checkInStart =
      approvedMinutes - 15;


    // ===================================================
    // TOO EARLY
    // ===================================================

    if (currentMinutes < checkInStart) {

      this.checkInOutStatus = 'NOT_AVAILABLE';

      const minutesRemaining =
        checkInStart - currentMinutes;

      Swal.fire({
        icon: 'info',
        title: 'Please Wait',
        html:
          `Approved meeting time: <b>${response.approvedMeetingTime}</b><br><br>` +
          `Check-in will be automatic from ` +
          `<b>${this.minutesToTime(checkInStart)}</b>.<br><br>` +
          `Please wait approximately <b>${minutesRemaining} minutes</b>.`,
        confirmButtonText: 'OK'
      });

      return;
    }


    // ===================================================
    // WITHIN 15 MINUTES BEFORE APPROVED TIME
    // OR APPROVED TIME HAS PASSED
    // ===================================================

    this.checkInOutStatus = 'CHECK_IN';

    this.performAutomaticCheckIn();

  }
}

performAutomaticCheckIn(): void {

  if (!this.checkInOutMeeting) {
    return;
  }

  const request = {
    mobileNo: this.checkInOutMeeting.mobileNo,
    meetingId: this.checkInOutMeeting.meetingId
  };

  this.checkInOutLoading = true;

  this.http.post<any>(
    `${environment.apiBaseUrl}/api/visitors/check-in-out`,
    request
  )
  .subscribe({

    next: (response) => {

      this.checkInOutLoading = false;

      this.checkInOutMeeting = response;

      // ==========================================
      // CHECK-IN SUCCESS
      // ==========================================

      if (
        response.entryTime &&
        !response.exitTime
      ) {

        this.checkInOutStatus = 'CHECK_OUT';

        Swal.fire({
          icon: 'success',
          title: 'Check-in Successful',
          text:
            `Visitor has been automatically checked in at ` +
            `${this.formatTime(response.entryTime)}.`,
          confirmButtonText: 'OK'
        });

        return;
      }

    },

    error: (error) => {

      this.checkInOutLoading = false;

      console.error(
        'Automatic check-in error:',
        error
      );

      Swal.fire({
        icon: 'error',
        title: 'Check-in Failed',
        text:
          error?.error?.message ||
          'Unable to automatically check in the visitor.',
        confirmButtonText: 'OK'
      });

    }

  });
}

checkIfCheckoutAllowed(response: any): void {

  if (!response.entryTime) {
    return;
  }

  const entryDate = this.parseDateTime(response.entryTime);

  if (!entryDate) {
    console.error(
      'Unable to parse entry time:',
      response.entryTime
    );

    return;
  }

  const now = new Date();

  const oneHourAfterEntry =
    entryDate.getTime() + (60 * 60 * 1000);


  // =====================================================
  // ONE HOUR HAS PASSED
  // =====================================================

  if (now.getTime() >= oneHourAfterEntry) {

    this.performAutomaticCheckout();

    return;
  }


  // =====================================================
  // ONE HOUR HAS NOT PASSED
  // =====================================================

  const remainingMilliseconds =
    oneHourAfterEntry - now.getTime();

  const remainingMinutes =
    Math.ceil(
      remainingMilliseconds / (60 * 1000)
    );

  Swal.fire({
    icon: 'info',
    title: 'Visitor Already Checked In',
    html:
      `Checked in at <b>${this.formatTime(response.entryTime)}</b>.<br><br>` +
      `Automatic check-out will be available after ` +
      `<b>${this.formatTime(
        new Date(oneHourAfterEntry).toTimeString().substring(0, 5)
      )}</b>.<br><br>` +
      `Approximately <b>${remainingMinutes} minutes</b> remaining.`,
    confirmButtonText: 'OK'
  });
}

performAutomaticCheckout(): void {

  if (!this.checkInOutMeeting) {
    return;
  }

  const request = {
    mobileNo: this.checkInOutMeeting.mobileNo,
    meetingId: this.checkInOutMeeting.meetingId
  };

  this.checkInOutLoading = true;

  this.http.post<any>(
    `${environment.apiBaseUrl}/api/visitors/check-in-out`,
    request
  )
  .subscribe({

    next: (response) => {

      this.checkInOutLoading = false;

      this.checkInOutMeeting = response;

      // ==========================================
      // CHECK-OUT SUCCESS
      // ==========================================

      if (
        response.entryTime &&
        response.exitTime
      ) {

        this.checkInOutStatus =
          'ALREADY_CHECKED_OUT';

        Swal.fire({
          icon: 'success',
          title: 'Check-out Successful',
          text:
            `Visitor has been automatically checked out at ` +
            `${this.formatTime(response.exitTime)}.`,
          confirmButtonText: 'OK'
        });

        return;
      }

    },

    error: (error) => {

      this.checkInOutLoading = false;

      console.error(
        'Automatic check-out error:',
        error
      );

      Swal.fire({
        icon: 'error',
        title: 'Check-out Failed',
        text:
          error?.error?.message ||
          'Unable to automatically check out the visitor.',
        confirmButtonText: 'OK'
      });

    }

  });
}

parseDateTime(value: string): Date | null {

  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

performCheckInOut(): void {

  if (!this.checkInOutMeeting) {
    return;
  }


  const request = {

    mobileNo:
      this.checkInOutMeeting.mobileNo,

    meetingId:
      this.checkInOutMeeting.meetingId

  };


  this.checkInOutLoading = true;


  this.http.post<any>(
    `${environment.apiBaseUrl}/api/visitors/check-in-out`,
    request
  )
  .subscribe({

    next: (response) => {

      this.checkInOutLoading = false;

      this.checkInOutMeeting =
        response;


      // ==============================================
      // CHECK-IN SUCCESS
      // ==============================================

      if (
        response.entryTime &&
        !response.exitTime
      ) {

        Swal.fire({
          icon: 'success',
          title: 'Check-in Successful',
          text:
            `Visitor checked in at ${this.formatTime(response.entryTime)}.`,
          confirmButtonText: 'OK'
        });

        return;
      }


      // ==============================================
      // CHECK-OUT SUCCESS
      // ==============================================

      if (
        response.entryTime &&
        response.exitTime
      ) {

        Swal.fire({
          icon: 'success',
          title: 'Check-out Successful',
          text:
            `Visitor checked out at ${this.formatTime(response.exitTime)}.`,
          confirmButtonText: 'OK'
        });

      }

    },

    error: (error) => {

      this.checkInOutLoading = false;

      console.error(
        'Check-in / Check-out error:',
        error
      );

      Swal.fire({
        icon: 'error',
        title: 'Unable to Process',
        text:
          error?.error?.message ||
          'Unable to process check-in/check-out.',
        confirmButtonText: 'OK'
      });

    }

  });

}

parseTime(
  time: string
): { hours: number; minutes: number } | null {

  if (!time) {
    return null;
  }

  const value = time.trim().toUpperCase();

  // Supports:
  // 04:30 PM
  // 4:30 PM
  // 04:30:00 PM
  // 17:30
  // 17:30:00

  let match = value.match(
    /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/
  );

  if (match) {

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3];

    if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    }

    return {
      hours,
      minutes
    };
  }


  // 24-hour format
  match = value.match(
    /^(\d{1,2}):(\d{2})(?::\d{2})?$/
  );

  if (match) {

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      return null;
    }

    return {
      hours,
      minutes
    };
  }


  console.error(
    'Unable to parse approved meeting time:',
    time
  );

  return null;
}

minutesToTime(
  totalMinutes: number
): string {

  totalMinutes =
    ((totalMinutes % 1440) + 1440) % 1440;

  let hours =
    Math.floor(totalMinutes / 60);

  const minutes =
    totalMinutes % 60;

  const period =
    hours >= 12 ? 'PM' : 'AM';


  if (hours === 0) {
    hours = 12;
  }
  else if (hours > 12) {
    hours -= 12;
  }


  return (
    `${hours.toString().padStart(2, '0')}:` +
    `${minutes.toString().padStart(2, '0')} ` +
    period
  );

}

formatTime(time: string): string {

  if (!time) {
    return '';
  }

  // Already formatted like 04:25 PM
  if (
    time.includes('AM') ||
    time.includes('PM')
  ) {
    return time;
  }

  const parts =
    time.split(':');

  if (parts.length < 2) {
    return time;
  }

  let hours =
    Number(parts[0]);

  const minutes =
    Number(parts[1]);

  const period =
    hours >= 12 ? 'PM' : 'AM';

  if (hours === 0) {
    hours = 12;
  }
  else if (hours > 12) {
    hours -= 12;
  }

  return (
    `${hours.toString().padStart(2, '0')}:` +
    `${minutes.toString().padStart(2, '0')} ` +
    period
  );

}

}