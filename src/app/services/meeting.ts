import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.service';

@Injectable({
  providedIn: 'root'
})
export class MeetingService {

  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) { }

  createMeeting(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/meetings`, data);
  }

  getAllMeetings(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/meetings`);
  }

  getMeetingsForHost(hostId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/meetings/host/${hostId}`);
  }

  approveMeeting(meetingId: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/meetings/${meetingId}/approve`, data);
  }

  rejectMeeting(meetingId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/meetings/${meetingId}/reject`, {});
  }

  // BUG FIX: this was ignoring `payload` and always sending {} — the
  // rescheduled date/time you pass in never reached the backend.
  holdMeeting(meetingId: number, payload: { approvedMeetingDate: string; approvedMeetingTime: string; }): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/meetings/${meetingId}/hold`, payload);
  }

  // Full visitor profile (name, address, state, district, org, email, photo path, etc.)
  getVisitorDetails(mobileNo: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/visitors/${mobileNo}`);
  }

  // Direct <img [src]> URL for the visitor's photo
  getVisitorPhotoUrl(mobileNo: string): string {
    return `${this.apiUrl}/api/visitors/${mobileNo}/photo`;
  }

  getLatestMeeting(hostId: string, mobileNo: string) {
    return this.http.get<any>(`${this.apiUrl}/api/meetings/latest`, {
      params: { hostId, mobileNo }
    });
  }

  getLatestMeetingForHost(hostId: string) {
    return this.http.get<any>(`${this.apiUrl}/api/meetings/host/${hostId}/latest`);
  }

  // NEW — decodes the token from a HostApproval email link into the
  // underlying meeting details (calls the new /api/meetings/resolve endpoint).
  resolveToken(token: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/meetings/resolve`, {
      params: { token }
    });
  }
}
// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable } from 'rxjs';
// import { environment } from '../environments/environment.service';

// @Injectable({
//   providedIn: 'root'
// })
// export class MeetingService {

//   private apiUrl = environment.apiBaseUrl;

//   constructor(private http: HttpClient) { }

//   createMeeting(data: any): Observable<any> {
//     return this.http.post(`${this.apiUrl}/api/meetings`, data);
//   }

//   getAllMeetings(): Observable<any> {
//     return this.http.get(`${this.apiUrl}/api/meetings`);
//   }

//   getMeetingsForHost(hostId: string): Observable<any> {
//     return this.http.get(`${this.apiUrl}/api/meetings/host/${hostId}`);
//   }

//   approveMeeting(meetingId: number, data: any): Observable<any> {
//     return this.http.put(`${this.apiUrl}/api/meetings/${meetingId}/approve`, data);
//   }

//   rejectMeeting(meetingId: number): Observable<any> {
//     return this.http.put(`${this.apiUrl}/api/meetings/${meetingId}/reject`, {});
//   }

//   holdMeeting(meetingId: number, payload: { approvedMeetingDate: string; approvedMeetingTime: string; }): Observable<any> {
//     return this.http.put(`${this.apiUrl}/api/meetings/${meetingId}/hold`, {});
//   }

//   // Full visitor profile (name, address, state, district, org, email, photo path, etc.)
//   getVisitorDetails(mobileNo: string): Observable<any> {
//     return this.http.get(`${this.apiUrl}/api/visitors/${mobileNo}`);
//   }

//   // Direct <img [src]> URL for the visitor's photo
//   getVisitorPhotoUrl(mobileNo: string): string {
//     return `${this.apiUrl}/api/visitors/${mobileNo}/photo`;
//   }
//    getLatestMeeting(hostId: string, mobileNo: string) {
//     return this.http.get<any>(`${this.apiUrl}/api/meetings/latest`, {
//       params: { hostId, mobileNo }
//     });
//   }
//    getLatestMeetingForHost(hostId: string) {
//     return this.http.get<any>(`${this.apiUrl}/api/meetings/host/${hostId}/latest`);
  
// }
// }
