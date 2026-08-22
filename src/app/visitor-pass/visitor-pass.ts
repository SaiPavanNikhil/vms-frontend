import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../environments/environment.service';

interface VisitorPassResponse {

  // =========================================================
  // PASS
  // =========================================================

  meetingId: number;

  passNo: string;


  // =========================================================
  // VISITOR DETAILS
  // =========================================================

  visitorName: string;

  mobileNo: string;

  company: string;

  address: string;

  purpose: string;

  photo: string;


  // =========================================================
  // VISIT DATE
  // =========================================================

  visitDate: string;


  // =========================================================
  // HOST DETAILS
  // =========================================================

  hostName: string;

  hostDesignation: string;

  department: string;


  // =========================================================
  // MEETING TIMES
  // =========================================================

  requestedMeetingTime: string;

  approvedMeetingTime: string;


  // =========================================================
  // QR CODE
  // =========================================================

  qrCode: string;
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

      // -----------------------------------------------------
      // The route parameter is the encrypted token
      // -----------------------------------------------------

      const encryptedToken =
        params.get('meetingId');

      console.log(
        'Encrypted Token:',
        encryptedToken
      );


      // -----------------------------------------------------
      // Validate token
      // -----------------------------------------------------

      if (!encryptedToken) {

        this.loading = false;

        this.errorMessage =
          'Invalid visitor pass link.';

        return;
      }


      // -----------------------------------------------------
      // Decrypt token
      // -----------------------------------------------------

      this.loading = true;

      this.errorMessage = '';

      this.http.get<{ meetingId: number }>(
        `${this.apiUrl}/decrypt/${encodeURIComponent(encryptedToken)}`
      )
      .subscribe({

        // ===================================================
        // DECRYPT SUCCESS
        // ===================================================

        next: (response) => {

          const meetingId =
            response.meetingId;

          console.log(
            'Decrypted Meeting ID:',
            meetingId
          );


          // -------------------------------------------------
          // Validate meeting ID
          // -------------------------------------------------

          if (!meetingId) {

            this.loading = false;

            this.errorMessage =
              'Invalid visitor pass link.';

            return;
          }


          // -------------------------------------------------
          // Load visitor pass
          // -------------------------------------------------

          this.loadVisitorPass(
            Number(meetingId)
          );

        },


        // ===================================================
        // DECRYPT ERROR
        // ===================================================

        error: (error) => {

          console.error(
            'Token decryption failed:',
            error
          );

          this.loading = false;

          this.passData = null;

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

    this.passData = null;


    this.http.get<VisitorPassResponse>(
      `${this.apiUrl}/${meetingId}`
    )
    .subscribe({

      // =======================================================
      // SUCCESS
      // =======================================================

      next: (response) => {

        console.log(
          'Visitor Pass Response:',
          response
        );


        // -----------------------------------------------------
        // Store response
        // -----------------------------------------------------

        this.passData = response;


        // -----------------------------------------------------
        // Stop loading
        // -----------------------------------------------------

        this.loading = false;


        // -----------------------------------------------------
        // Force change detection
        // -----------------------------------------------------

        this.cdr.detectChanges();

      },


      // =======================================================
      // ERROR
      // =======================================================

      error: (error) => {

        console.error(
          'Visitor pass error:',
          error
        );


        this.loading = false;

        this.passData = null;


        this.errorMessage =
          error?.error?.message ||
          'Unable to load visitor pass.';

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

  getPhotoUrl(
    mobileNo: string
  ): string {

    if (!mobileNo) {

      return 'assets/default-visitor.png';

    }


    return `${environment.apiBaseUrl}/api/visitor-pass/photo/${mobileNo}`;

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
printPass(): void {

  const passElement =
    document.querySelector('.visitor-pass') as HTMLElement;

  if (!passElement) {
    console.error('Visitor pass element not found.');
    return;
  }


  // =========================================================
  // CREATE PRINT IFRAME
  // =========================================================

  const iframe = document.createElement('iframe');

  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';

  iframe.style.width = '1px';
  iframe.style.height = '1px';

  iframe.style.border = '0';

  document.body.appendChild(iframe);


  const printDocument =
    iframe.contentDocument ||
    iframe.contentWindow?.document;

  if (!printDocument) {

    document.body.removeChild(iframe);

    return;
  }


  // =========================================================
  // COPY STYLES
  // =========================================================

  const styles =
    Array.from(
      document.querySelectorAll(
        'link[rel="stylesheet"], style'
      )
    )
    .map((element: Element) =>
      element.outerHTML
    )
    .join('\n');


  // =========================================================
  // PRINT HTML
  // =========================================================

  printDocument.open();

  printDocument.write(`
    <!DOCTYPE html>

    <html>

      <head>

        <meta charset="UTF-8">

        <title>Visitor Pass</title>

        ${styles}

        <style>

          /* =================================================
             PRINT PAPER
          ================================================= */

          @page {
            size: A4 portrait;
            margin: 15mm;
          }


          html,
          body {
            margin: 0;
            padding: 0;

            background: #ffffff;
          }


          body {
            width: 100%;

            display: flex;

            align-items: flex-start;

            justify-content: flex-start;

            box-sizing: border-box;
          }


          /* =================================================
             PRINT CARD
          ================================================= */

          .visitor-pass {

            width: 85.6mm !important;

            height: 54mm !important;

            max-width: 85.6mm !important;

            max-height: 54mm !important;

            min-height: 54mm !important;

            margin: 0 !important;

            padding: 0 !important;

            overflow: hidden !important;

            box-sizing: border-box;

            border-radius: 3mm !important;

            box-shadow: none !important;

            border: 0.3mm solid #d5dce6 !important;

          }


          /* =================================================
             HEADER
          ================================================= */

          .pass-header {

            height: 10mm !important;

            padding: 1.5mm 3mm !important;

            gap: 2mm !important;

          }


          .header-building-icon {

            height: 6mm !important;

            gap: 0.5mm !important;

          }


          .building {

            width: 1.3mm !important;

          }


          .building-one {
            height: 4mm !important;
          }

          .building-two {
            height: 6mm !important;
          }

          .building-three {
            height: 5mm !important;
          }


          .header-content h1 {

            font-size: 4mm !important;

          }


          .header-content p {

            margin-top: 0.7mm !important;

            font-size: 1.5mm !important;

          }


          /* =================================================
             VISITOR BODY
          ================================================= */

          .pass-body {

            min-height: 21mm !important;

            height: 21mm !important;

            padding: 2.5mm 3mm !important;

          }


          .visitor-section {

            gap: 3mm !important;

          }


          /* =================================================
             PHOTO
          ================================================= */

          .photo-container {

            width: 17mm !important;

            height: 20mm !important;

            padding: 0.5mm !important;

            border-radius: 1mm !important;

          }


          /* =================================================
             VISITOR DETAILS
          ================================================= */

          .visitor-details {

            padding-top: 0 !important;

          }


          .visitor-details::before {

            margin-bottom: 1.5mm !important;

            padding-bottom: 1mm !important;

            font-size: 1.7mm !important;

          }


          .detail-row {

            grid-template-columns:
              15mm
              2mm
              minmax(0, 1fr) !important;

            margin-bottom: 0.8mm !important;

            font-size: 1.7mm !important;

            line-height: 1.2 !important;

          }


          /* =================================================
             DIVIDER
          ================================================= */

          .pass-divider {

            margin: 0 3mm !important;

            height: 0.2mm !important;

          }


          /* =================================================
             MEETING SECTION
          ================================================= */

          .visit-information {

            min-height: 17mm !important;

            height: 17mm !important;

            padding:
              2mm
              3mm
              1mm
              3mm !important;

            padding-right: 29mm !important;

          }


          .visit-information::before {

            margin-bottom: 1.5mm !important;

            padding-bottom: 0.8mm !important;

            font-size: 1.7mm !important;

          }


          .visit-row {

            grid-template-columns:
              3mm
              15mm
              2mm
              minmax(0, 1fr) !important;

            margin-bottom: 0.8mm !important;

            font-size: 1.6mm !important;

            line-height: 1.1 !important;

          }


          .visit-icon {

            width: 3mm !important;

            font-size: 1.7mm !important;

          }


          .host-value strong {

            font-size: 1.6mm !important;

          }


          .host-value small {

            font-size: 1.3mm !important;

          }


          /* =================================================
             QR
          ================================================= */

          .qr-section {

            right: 3mm !important;

            top: 3mm !important;

            width: 23mm !important;

          }


          .qr-container {

            width: 20mm !important;

            height: 20mm !important;

            padding: 0.7mm !important;

            border-radius: 1mm !important;

          }


          .qr-container img {

            width: 18.5mm !important;

            height: 18.5mm !important;

          }


          .pass-number-container {

            margin-top: 0.7mm !important;

          }


          .pass-number-label {

            margin-bottom: 0.3mm !important;

            font-size: 1.2mm !important;

          }


          .pass-number {

            font-size: 1.3mm !important;

          }


          /* =================================================
             FOOTER
          ================================================= */

          .pass-footer {

            min-height: 5.5mm !important;

            height: 5.5mm !important;

            padding: 1mm 2mm !important;

            gap: 0.3mm !important;

          }


          .pass-footer p {

            font-size: 1.3mm !important;

          }


          /* =================================================
             PRINT COLORS
          ================================================= */

          .pass-header,
          .visit-information,
          .pass-footer,
          .qr-container {

            -webkit-print-color-adjust: exact !important;

            print-color-adjust: exact !important;

          }

        </style>

      </head>


      <body>

        ${passElement.outerHTML}

      </body>

    </html>
  `);

  printDocument.close();


  // =========================================================
  // WAIT FOR IMAGES
  // =========================================================

  const printWindow =
    iframe.contentWindow;

  if (!printWindow) {

    document.body.removeChild(iframe);

    return;
  }


  const images =
    Array.from(printDocument.images);


  const imagePromises =
    images.map(image => {

      if (image.complete) {

        return Promise.resolve();

      }

      return new Promise<void>(resolve => {

        image.onload = () => resolve();

        image.onerror = () => resolve();

      });

    });


  Promise.all(imagePromises)
    .then(() => {

      setTimeout(() => {

        printWindow.focus();

        printWindow.print();


        setTimeout(() => {

          if (iframe.parentNode) {

            iframe.parentNode.removeChild(iframe);

          }

        }, 1000);

      }, 500);

    });

}

}