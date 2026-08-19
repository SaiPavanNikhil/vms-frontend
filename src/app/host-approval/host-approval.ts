import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MeetingService } from '../services/meeting';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-host-approval',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './host-approval.html',
  styleUrl: './host-approval.css'
})
export class HostApproval implements OnInit {

  meetings: any[] = [];
  filteredMeetings: any[] = [];
  searchText = '';

  showModal = false;
  selectedMeeting: any = null;
  selectedVisitor: any = null;
  visitorPhotoUrl: string | null = null;
  loadingVisitor = false;

  actionLoading = false;
  actionLoadingMessage = '';

  showHoldForm = false;
  holdDate = '';
  holdTime = '';

  generatingFile = false;

  @ViewChild('detailsCard') detailsCardRef!: ElementRef<HTMLDivElement>;

  hostId: string | null = null;
  mobileNo: string | null = null;

  constructor(
    private meetingService: MeetingService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];

      if (token) {
        // Email links carry an AES token (TokenUtil.encode on the backend).
        // Resolve it server-side and jump straight to that visitor's request,
        // instead of loading everything and requiring a manual "View" click.
        this.meetingService.resolveToken(token).subscribe({
          next: (meeting: any) => {
            this.hostId = meeting.hostId;
            this.mobileNo = meeting.mobileNo;
            this.loadMeetings(meeting);
          },
          error: (err: any) => {
            console.error(err);
            alert('This link is invalid or has expired.');
            this.loadMeetings(); // fall back to the full list rather than a dead page
          }
        });
        return;
      }

      // Fallback: plain params still work if no token present
      this.hostId = params['hostId'] || null;
      this.mobileNo = params['mobileNo'] || null;
      this.loadMeetings();
    });
  }

  loadMeetings(resolvedMeeting?: any): void {
    const source$ = this.hostId
      ? this.meetingService.getMeetingsForHost(this.hostId)
      : this.meetingService.getAllMeetings();

    source$.subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.meetings = res;

          this.filteredMeetings = this.mobileNo
            ? res.filter((m: any) => m.mobileNo === this.mobileNo)
            : [...res];

          this.cdr.detectChanges();

          if (resolvedMeeting) {
            // We already know exactly which record the link points to —
            // open it by meetingId rather than trusting array order.
            const match = res.find((m: any) => m.meetingId === resolvedMeeting.meetingId);
            if (match) {
              this.viewDetails(match);
            } else {
              console.warn(`Resolved meetingId=${resolvedMeeting.meetingId} not found in loaded list`);
            }
          } else if (this.mobileNo && this.filteredMeetings.length > 0) {
            this.viewDetails(this.filteredMeetings[0]);
          } else if (this.mobileNo && this.filteredMeetings.length === 0) {
            console.warn(`No meeting found for mobileNo=${this.mobileNo} under hostId=${this.hostId}`);
          }
        }, 0);
      },
      error: (err: any) => {
        console.error(err);
        alert('Unable to load meeting requests.');
      }
    });
  }  

  onSearch(): void {
    const search = this.searchText.trim().toLowerCase();
    if (!search) {
      this.filteredMeetings = [...this.meetings];
      return;
    }
    this.filteredMeetings = this.meetings.filter((m: any) =>
      (m.visitorName || '').toLowerCase().includes(search) ||
      (m.hostName || '').toLowerCase().includes(search) ||
      (m.mobileNo || '').toLowerCase().includes(search)
    );
  }

  get isApproved(): boolean {
    return this.selectedMeeting?.acceptFlag === 'Y';
  }

  get isPending(): boolean {
    return this.selectedMeeting?.acceptFlag === 'N';
  }

  get minHoldDate(): string {
    return new Date().toISOString().substring(0, 10);
  }

  viewDetails(meeting: any): void {
    this.selectedMeeting = meeting;
    this.selectedVisitor = null;
    this.visitorPhotoUrl = this.meetingService.getVisitorPhotoUrl(meeting.mobileNo);
    this.loadingVisitor = true;
    this.showModal = true;
    this.showHoldForm = false;
    this.holdDate = meeting.requestedMeetingDate || '';
    this.holdTime = (meeting.requestedMeetingTime || '').substring(0, 5);

    this.meetingService.getVisitorDetails(meeting.mobileNo).subscribe({
      next: (visitor: any) => {
        this.selectedVisitor = visitor;
        this.loadingVisitor = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(err);
        this.loadingVisitor = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedMeeting = null;
    this.selectedVisitor = null;
    this.visitorPhotoUrl = null;
    this.showHoldForm = false;
    this.holdDate = '';
    this.holdTime = '';
  }

  onPhotoError(): void {
    this.visitorPhotoUrl = null;
  }

  approve(): void {

    if (this.actionLoading) {
    return;
  }

  this.actionLoading = true;
  this.actionLoadingMessage = 'Approving visitor meeting...';
    if (!this.selectedMeeting) return;
    const payload = {
      approvedMeetingDate: this.selectedMeeting.requestedMeetingDate,
      approvedMeetingTime: this.selectedMeeting.requestedMeetingTime
    };
    this.meetingService.approveMeeting(this.selectedMeeting.meetingId, payload).subscribe({
      next: () => {
        this.selectedMeeting = {
          ...this.selectedMeeting,
          acceptFlag: 'Y',
          approvedMeetingDate: payload.approvedMeetingDate,
          approvedMeetingTime: payload.approvedMeetingTime
        };
        this.actionLoading = false;
        this.cdr.detectChanges();
        this.loadMeetings();
      },
      error: (err: any) => {
        this.actionLoading = false;
        console.error(err);
        alert('Unable to approve meeting.');
      }
    });
  }

  openHoldForm(): void {
    this.showHoldForm = true;
  }

  cancelHoldForm(): void {
    this.showHoldForm = false;
  }

  hold(): void {
    if (!this.showHoldForm) {
      this.openHoldForm();
      return;
    }
    this.saveHold();
  }

  saveHold(): void {
    if (!this.selectedMeeting) return;
    if (!this.holdDate || !this.holdTime) {
      alert('Please select both a date and a time for the rescheduled meeting.');
      return;
    }
    if (this.holdDate < this.minHoldDate) {
      alert('Please select today or a future date.');
      return;
    }
    const payload = {
      approvedMeetingDate: this.holdDate,
      approvedMeetingTime: this.holdTime + ':00'
    };
    this.meetingService.holdMeeting(this.selectedMeeting.meetingId, payload).subscribe({
      next: () => {
        this.selectedMeeting = {
          ...this.selectedMeeting,
          acceptFlag: 'H',
          approvedMeetingDate: payload.approvedMeetingDate,
          approvedMeetingTime: payload.approvedMeetingTime
        };
        this.showHoldForm = false;
        this.cdr.detectChanges();
        alert('Meeting put on hold with a new proposed time.');
        this.closeModal();
        this.loadMeetings();
      },
      error: (err: any) => {
        console.error(err);
        alert('Unable to hold meeting.');
      }
    });
  }

  reject(): void {
    if (!this.selectedMeeting) return;
    if (!confirm('Reject this meeting request?')) return;
    this.meetingService.rejectMeeting(this.selectedMeeting.meetingId).subscribe({
      next: () => {
        this.selectedMeeting = {
          ...this.selectedMeeting,
          acceptFlag: 'R'
        };
        this.cdr.detectChanges();
        alert('Meeting rejected.');
        this.closeModal();
        this.loadMeetings();
      },
      error: (err: any) => {
        console.error(err);
        alert('Unable to reject meeting.');
      }
    });
  }

  statusLabel(flag: string): string {
    if (flag === 'Y') return 'Approved';
    if (flag === 'R') return 'Rejected';
    if (flag === 'H') return 'Hold';
    return 'Pending';
  }

  private async renderCanvas(): Promise<HTMLCanvasElement> {
    const element = this.detailsCardRef.nativeElement;
    return html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
  }

  async downloadPdf(): Promise<void> {
    if (this.generatingFile) return;
    this.generatingFile = true;
    try {
      const canvas = await this.renderCanvas();
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`visitor-pass-${this.selectedMeeting?.mobileNo || 'visitor'}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Unable to generate PDF.');
    } finally {
      this.generatingFile = false;
    }
  }

  async downloadImage(): Promise<void> {

  if (this.generatingFile) {
    return;
  }

  if (!this.visitorPhotoUrl) {
    Swal.fire({
      icon: 'warning',
      title: 'Photo Not Available',
      text: 'Visitor photo is not available for download.',
      confirmButtonText: 'OK'
    });

    return;
  }

  this.generatingFile = true;

  try {

    const response = await fetch(this.visitorPhotoUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to download visitor photo: ${response.status}`
      );
    }

    const blob = await response.blob();

    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = blobUrl;

    link.download =
      `visitor-photo-${this.selectedMeeting?.mobileNo || 'visitor'}.jpg`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(blobUrl);

  } catch (err) {

    console.error(
      'Unable to download visitor photo:',
      err
    );

    Swal.fire({
      icon: 'error',
      title: 'Download Failed',
      text: 'Unable to download the visitor photo.',
      confirmButtonText: 'OK'
    });

  } finally {

    this.generatingFile = false;
  }
}
}
// import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { ActivatedRoute } from '@angular/router';
// import { MeetingService } from '../services/meeting';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';

// @Component({
//   selector: 'app-host-approval',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './host-approval.html',
//   styleUrl: './host-approval.css'
// })
// export class HostApproval implements OnInit {

//   meetings: any[] = [];
//   filteredMeetings: any[] = [];
//   searchText = '';

//   showModal = false;
//   selectedMeeting: any = null;
//   selectedVisitor: any = null;
//   visitorPhotoUrl: string | null = null;
//   loadingVisitor = false;

//   showHoldForm = false;
//   holdDate = '';
//   holdTime = '';

//   generatingFile = false;

//   @ViewChild('detailsCard') detailsCardRef!: ElementRef<HTMLDivElement>;

//   hostId: string | null = null;
//   mobileNo: string | null = null;

//   constructor(
//     private meetingService: MeetingService,
//     private cdr: ChangeDetectorRef,
//     private route: ActivatedRoute,
//   ) { }

//   ngOnInit(): void {
//     this.route.queryParams.subscribe(params => {
//       const token = params['token'];

//       if (token) {
//         // Email links carry an AES token (TokenUtil.encode on the backend).
//         // Resolve it server-side and jump straight to that visitor's request,
//         // instead of loading everything and requiring a manual "View" click.
//         this.meetingService.resolveToken(token).subscribe({
//           next: (meeting: any) => {
//             this.hostId = meeting.hostId;
//             this.mobileNo = meeting.mobileNo;
//             this.loadMeetings(meeting);
//           },
//           error: (err: any) => {
//             console.error(err);
//             alert('This link is invalid or has expired.');
//             this.loadMeetings(); // fall back to the full list rather than a dead page
//           }
//         });
//         return;
//       }

//       // Fallback: plain params still work if no token present
//       this.hostId = params['hostId'] || null;
//       this.mobileNo = params['mobileNo'] || null;
//       this.loadMeetings();
//     });
//   }

//   loadMeetings(resolvedMeeting?: any): void {
//     const source$ = this.hostId
//       ? this.meetingService.getMeetingsForHost(this.hostId)
//       : this.meetingService.getAllMeetings();

//     source$.subscribe({
//       next: (res: any) => {
//         setTimeout(() => {
//           this.meetings = res;

//           this.filteredMeetings = this.mobileNo
//             ? res.filter((m: any) => m.mobileNo === this.mobileNo)
//             : [...res];

//           this.cdr.detectChanges();

//           if (resolvedMeeting) {
//             // We already know exactly which record the link points to —
//             // open it by meetingId rather than trusting array order.
//             const match = res.find((m: any) => m.meetingId === resolvedMeeting.meetingId);
//             if (match) {
//               this.viewDetails(match);
//             } else {
//               console.warn(`Resolved meetingId=${resolvedMeeting.meetingId} not found in loaded list`);
//             }
//           } else if (this.mobileNo && this.filteredMeetings.length > 0) {
//             this.viewDetails(this.filteredMeetings[0]);
//           } else if (this.mobileNo && this.filteredMeetings.length === 0) {
//             console.warn(`No meeting found for mobileNo=${this.mobileNo} under hostId=${this.hostId}`);
//           }
//         }, 0);
//       },
//       error: (err: any) => {
//         console.error(err);
//         alert('Unable to load meeting requests.');
//       }
//     });
//   }

//   onSearch(): void {
//     const search = this.searchText.trim().toLowerCase();
//     if (!search) {
//       this.filteredMeetings = [...this.meetings];
//       return;
//     }
//     this.filteredMeetings = this.meetings.filter((m: any) =>
//       (m.visitorName || '').toLowerCase().includes(search) ||
//       (m.hostName || '').toLowerCase().includes(search) ||
//       (m.mobileNo || '').toLowerCase().includes(search)
//     );
//   }

//   get isApproved(): boolean {
//     return this.selectedMeeting?.acceptFlag === 'Y';
//   }

//   viewDetails(meeting: any): void {
//     this.selectedMeeting = meeting;
//     this.selectedVisitor = null;
//     this.visitorPhotoUrl = this.meetingService.getVisitorPhotoUrl(meeting.mobileNo);
//     this.loadingVisitor = true;
//     this.showModal = true;
//     this.showHoldForm = false;
//     this.holdDate = meeting.requestedMeetingDate || '';
//     this.holdTime = (meeting.requestedMeetingTime || '').substring(0, 5);

//     this.meetingService.getVisitorDetails(meeting.mobileNo).subscribe({
//       next: (visitor: any) => {
//         this.selectedVisitor = visitor;
//         this.loadingVisitor = false;
//         this.cdr.detectChanges();
//       },
//       error: (err: any) => {
//         console.error(err);
//         this.loadingVisitor = false;
//         this.cdr.detectChanges();
//       }
//     });
//   }

//   closeModal(): void {
//     this.showModal = false;
//     this.selectedMeeting = null;
//     this.selectedVisitor = null;
//     this.visitorPhotoUrl = null;
//     this.showHoldForm = false;
//     this.holdDate = '';
//     this.holdTime = '';
//   }

//   onPhotoError(): void {
//     this.visitorPhotoUrl = null;
//   }

//   approve(): void {
//     if (!this.selectedMeeting) return;
//     const payload = {
//       approvedMeetingDate: this.selectedMeeting.requestedMeetingDate,
//       approvedMeetingTime: this.selectedMeeting.requestedMeetingTime
//     };
//     this.meetingService.approveMeeting(this.selectedMeeting.meetingId, payload).subscribe({
//       next: () => {
//         this.selectedMeeting = {
//           ...this.selectedMeeting,
//           acceptFlag: 'Y',
//           approvedMeetingDate: payload.approvedMeetingDate,
//           approvedMeetingTime: payload.approvedMeetingTime
//         };
//         this.cdr.detectChanges();
//         this.loadMeetings();
//       },
//       error: (err: any) => {
//         console.error(err);
//         alert('Unable to approve meeting.');
//       }
//     });
//   }

//   openHoldForm(): void {
//     this.showHoldForm = true;
//   }

//   cancelHoldForm(): void {
//     this.showHoldForm = false;
//   }

//   hold(): void {
//     if (!this.showHoldForm) {
//       this.openHoldForm();
//       return;
//     }
//     this.saveHold();
//   }

//   saveHold(): void {
//     if (!this.selectedMeeting) return;
//     if (!this.holdDate || !this.holdTime) {
//       alert('Please select both a date and a time for the rescheduled meeting.');
//       return;
//     }
//     const payload = {
//       approvedMeetingDate: this.holdDate,
//       approvedMeetingTime: this.holdTime + ':00'
//     };
//     this.meetingService.holdMeeting(this.selectedMeeting.meetingId, payload).subscribe({
//       next: () => {
//         alert('Meeting put on hold with a new proposed time.');
//         this.closeModal();
//         this.loadMeetings();
//       },
//       error: (err: any) => {
//         console.error(err);
//         alert('Unable to hold meeting.');
//       }
//     });
//   }

//   reject(): void {
//     if (!this.selectedMeeting) return;
//     if (!confirm('Reject this meeting request?')) return;
//     this.meetingService.rejectMeeting(this.selectedMeeting.meetingId).subscribe({
//       next: () => {
//         alert('Meeting rejected.');
//         this.closeModal();
//         this.loadMeetings();
//       },
//       error: (err: any) => {
//         console.error(err);
//         alert('Unable to reject meeting.');
//       }
//     });
//   }

//   statusLabel(flag: string): string {
//     if (flag === 'Y') return 'Approved';
//     if (flag === 'R') return 'Rejected';
//     if (flag === 'H') return 'Hold';
//     return 'Pending';
//   }

//   private async renderCanvas(): Promise<HTMLCanvasElement> {
//     const element = this.detailsCardRef.nativeElement;
//     return html2canvas(element, {
//       scale: 2,
//       useCORS: true,
//       backgroundColor: '#ffffff'
//     });
//   }

//   async downloadPdf(): Promise<void> {
//     if (this.generatingFile) return;
//     this.generatingFile = true;
//     try {
//       const canvas = await this.renderCanvas();
//       const imgData = canvas.toDataURL('image/png');
//       const pdf = new jsPDF({
//         orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
//         unit: 'pt',
//         format: [canvas.width, canvas.height]
//       });
//       pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
//       pdf.save(`visitor-pass-${this.selectedMeeting?.mobileNo || 'visitor'}.pdf`);
//     } catch (err) {
//       console.error(err);
//       alert('Unable to generate PDF.');
//     } finally {
//       this.generatingFile = false;
//     }
//   }

//   async downloadImage(): Promise<void> {
//     if (this.generatingFile) return;
//     this.generatingFile = true;
//     try {
//       const canvas = await this.renderCanvas();
//       const link = document.createElement('a');
//       link.download = `visitor-pass-${this.selectedMeeting?.mobileNo || 'visitor'}.png`;
//       link.href = canvas.toDataURL('image/png');
//       link.click();
//     } catch (err) {
//       console.error(err);
//       alert('Unable to generate image.');
//     } finally {
//       this.generatingFile = false;
//     }
//   }
// }
