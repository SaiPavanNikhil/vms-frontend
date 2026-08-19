import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { State, City } from 'country-state-city';
import type { IState, ICity } from 'country-state-city';
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

  private stream: MediaStream | null = null;

  private readonly countryCode = 'IN';
  private readonly apiUrl = `${environment.apiBaseUrl}/api/visitors`;

  states: IState[] = [];
  districts: ICity[] = [];

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
      purposeOfVisit: ['', [Validators.required, Validators.maxLength(30)]],
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
      this.districts = stateCode ? City.getCitiesOfState(this.countryCode, stateCode) : [];
      if (!this.checkingMobile) {
        this.visitorForm.get('district')?.setValue('');
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

  ngOnInit(): void {
    this.loadSections();
    this.loadEmployees();
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

    // Allow only numbers
    const mobileNo = input.value.replace(/\D/g, '').slice(0, 10);

    input.value = mobileNo;

    this.f['mobileNo'].setValue(mobileNo, {
      emitEvent: false
    });

    // Automatically trigger verification
    // when exactly 10 digits are entered
    if (mobileNo.length === 10) {

      this.onMobileBlur();

    }

  }

  onMobileBlur() {
    const mobileNo = this.f['mobileNo'].value;
    if (!mobileNo || this.f['mobileNo'].invalid) {
      return;
    }

    this.checkingMobile = true;

    this.http.get<any>(`${this.apiUrl}/${mobileNo}`).pipe(
      timeout(6000),
      catchError(() => {
        this.isUpdateMode = false;
        return of(null);
      }),
      finalize(() => {
        this.checkingMobile = false;
      })
    ).subscribe((visitor) => {
      if (!visitor) {
        return;
      }

      this.isUpdateMode = true;

      this.visitorForm.patchValue({
        firstName: visitor.firstName,
        lastName: visitor.lastName,
        email: visitor.email,
        organisation: visitor.organisation,
        organisationAddress: visitor.address,
        designation: visitor.designation,
        state: visitor.state,
        purposeOfVisit: visitor.purposeOfVisit
      });

      this.districts = visitor.state ? City.getCitiesOfState(this.countryCode, visitor.state) : [];
      this.visitorForm.patchValue({ district: visitor.district });

      if (visitor.department) {
        this.filteredEmployees = this.employees.filter(e => e.sectionId === visitor.department);
        this.visitorForm.patchValue({
          department: visitor.department,
          meetPersonName: visitor.meetPersonName
        });
      }

      if (visitor.photo) {
        this.photoDataUrl = null;
      }

      this.cdr.detectChanges();
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


  const request$ = this.isUpdateMode
    ? this.http.put(
        `${this.apiUrl}/${raw.mobileNo}`,
        payload
      )
    : this.http.post(
        this.apiUrl,
        payload
      );


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
    const todayStr = new Date().toISOString().substring(0, 10);
    this.visitorForm.reset({
      registrationDate: todayStr,
      modeOfVisit: { value: 'Unit', disabled: true }
    });
    this.photoDataUrl = null;
    this.districts = [];
    this.filteredEmployees = [];
    this.isUpdateMode = false;
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
            ? 'Visitor Updated Successfully'
            : 'Visitor Registered Successfully',

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
}