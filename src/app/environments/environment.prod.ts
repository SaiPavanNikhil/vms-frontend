// console.log("Host:", window.location.hostname);

// console.log("origin:", window.location.origin);

// export const environment = {
//   production: true,
// //   apiBaseUrl: 'https://ai-exam-backend-code-production.up.railway.app'
//   apiBaseUrl : 'http://172.16.1.35:8080'
//   // apiBaseUrl: 'http://localhost:8000'
// };

console.log("Host:", window.location.hostname);

console.log("origin:", window.location.origin);

export const environment = {
  production: true,
  apiBaseUrl: `${window.location.origin}/vms-backend`
};
