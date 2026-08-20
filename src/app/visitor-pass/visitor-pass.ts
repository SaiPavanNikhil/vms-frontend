import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../environments/environment.service';

interface VisitorPassResponse {

  meetingId: number;

  passNo: string;

  visitorName: string;

  company: string;

  purpose: string;

  mobileNo: string;

  photo: string;

  visitDate: string;

  hostName: string;

  hostDesignation: string;
}

@Component({
  selector: 'app-visitor-pass',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule
  ],
  templateUrl: './visitor-pass.html',
  styleUrl: './visitor-pass.css'
})
export class VisitorPass implements OnInit {

  // =========================================================
  // API URL
  // =========================================================

  private readonly apiUrl =
    `${environment.apiBaseUrl}/api/visitor-pass`;


  // =========================================================
  // PASS DATA
  // =========================================================

  passData: VisitorPassResponse | null = null;


  // =========================================================
  // STATES
  // =========================================================

  loading: boolean = true;

  errorMessage: string = '';


  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {

      // This is actually the encrypted token
      const encryptedToken = params.get('meetingId');

      console.log('Encrypted Token:', encryptedToken);

      if (!encryptedToken) {

        this.loading = false;

        this.errorMessage =
          'Invalid visitor pass link.';

        return;
      }

      // Send encrypted token to backend
      this.http.get<{ meetingId: number }>(
        `${this.apiUrl}/decrypt/${encodeURIComponent(encryptedToken)}`
      )
      .subscribe({

        next: (response) => {

          // Backend returns actual meeting ID
          const meetingId = response.meetingId;

          console.log('Decrypted Meeting ID:', meetingId);

          if (!meetingId) {

            this.loading = false;

            this.errorMessage =
              'Invalid visitor pass link.';

            return;
          }

          // YOUR EXISTING METHOD
          this.loadVisitorPass(
            Number(meetingId)
          );

        },

        error: (error) => {

          console.error(
            'Token decryption failed:',
            error
          );

          this.loading = false;

          this.errorMessage =
            'Invalid or expired visitor pass link.';

        }

      });

    });

  }


  // =========================================================
  // GET VISITOR PASS
  // =========================================================

  loadVisitorPass(
    meetingId: number
  ): void {

    this.loading = true;

    this.errorMessage = '';

    this.http.get<VisitorPassResponse>(
      `${this.apiUrl}/${meetingId}`
    )
    .subscribe({

      // =======================================================
      // SUCCESS
      // =======================================================

      next: (response) => {

        this.loading = false;

        this.passData = response;

        console.log(
          'Visitor Pass:',
          response
        );

        this.cdr.detectChanges();

      },


      // =======================================================
      // ERROR
      // =======================================================

      error: (error) => {

        this.loading = false;

        this.passData = null;

        this.errorMessage =
          error?.error?.message ||
          'Unable to load visitor pass.';

        console.error(
          'Visitor pass error:',
          error
        );

      }

    });

  }


  // =========================================================
  // FORMAT DATE
  // =========================================================

  formatDate(
    date: string
  ): string {

    if (!date) {
      return '';
    }

    const parsedDate =
      new Date(date + 'T00:00:00');

    return parsedDate.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );

  }


  // =========================================================
  // PHOTO URL
  // =========================================================

  getPhotoUrl(mobileNo: string): string {

  if (!mobileNo) {
    return 'assets/default-visitor.png';
  }

  return `http://localhost:8080/api/visitor-pass/photo/${mobileNo}`;
}


  // =========================================================
  // IMAGE ERROR
  // =========================================================

  onImageError(
    event: Event
  ): void {

    const image =
      event.target as HTMLImageElement;

    image.src =
      'assets/default-visitor.png';

  }

}