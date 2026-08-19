import { Routes } from '@angular/router';
import { HomeComponent } from './home-page/home-page';
import { AdminPage } from './admin-page/admin-page';
import { VisitorForm } from './visitor-form/visitor-form';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { AdminHome } from './admin-home/admin-home';
import { SectionManagement } from './section-management/section-management';
import { EmployeeManagement } from './employee-management/employee-management';
import { HostApproval } from './host-approval/host-approval';
import { VisitorManagement } from './visitor-management/visitor-management';
import { EmployeeLogin } from './employee-login/employee-login';
import { EmployeeDashboard } from './employee-dashboard/employee-dashboard';
import { EmployeeDashboardHome } from './employee-dashboard-home/employee-dashboard-home';
import { EmployeeMeeting } from './employee-meeting/employee-meeting';
import { ParticipantResponse } from './participant-response/participant-response';
import { VisitorCheckInOut } from './visitor-check-in-out/visitor-check-in-out';
import { VisitorPass } from './visitor-pass/visitor-pass';

export const routes: Routes = [
  { path: '', redirectTo: 'home-page', pathMatch: 'full' },
  { path: 'home-page', component: HomeComponent },
  { path: 'admin', component: AdminPage },
  { path: 'Visitor-Form', component: VisitorForm },
  { path: 'HostApproval', component: HostApproval },
  {
    path: 'visitor-pass/:meetingId',
    component: VisitorPass
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboard,
    children: [

      {
        path: '',
        component: AdminHome
      },
      {
        path: 'section-management',
        component: SectionManagement
      },
      {
        path: 'employee-management',
        component: EmployeeManagement
      },
      {
        path: 'visitor-management',
        component: VisitorManagement
      },
    ]
  },
   { path: 'login', component: EmployeeLogin },
   {
    path: 'employee-dashboard',
    component: EmployeeDashboard,

    children: [

      // Default dashboard page
      {
        path: '',
        pathMatch: 'full',
        component: EmployeeDashboardHome
      },

      // Schedule Meeting
      {
        path: 'meeting',
        component: EmployeeMeeting
      }

    ]
  },
  {
        path: 'participant-response',
        component: ParticipantResponse
      },

  { path: 'visitor-check', component: VisitorCheckInOut },
  { path: '**', redirectTo: 'home-page' }
];