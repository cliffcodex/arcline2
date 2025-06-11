// login.js

import axios from 'axios';

// Your login credentials
const data = {
  email: 'chat@chat.com',
  password: 'password'
};

// Get the user's local time zone using Intl API
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Make the login request with timezone in headers
axios.post('http://localhost:5000/api/auth/login', data, {
  headers: {
    'Content-Type': 'application/json',
    'x-user-timezone': userTimezone
  }
})
.then(response => {
  console.log('✅ Login Success');
  console.log(response.data);
})
.catch(error => {
  console.error('❌ Login Failed');
  console.error(error.response?.data || error.message);
});
