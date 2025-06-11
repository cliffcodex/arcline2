import axios from 'axios';

// Your login credentials
const data = {
  email: 'chat@chat.com', // Replace with user input or your test credentials
  password: 'password'    // Replace with user input or your test credentials
};

// Get the user's local time zone using Intl API
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Make the login request with timezone in headers
axios.post('http://localhost:5000/api/auth/login', data, {
  headers: {
    'Content-Type': 'application/json',
    'x-user-timezone': userTimezone // Adding the timezone in headers for backend use
  }
})
.then(response => {
  console.log('✅ Login Success');
  console.log(response.data);
})
.catch(error => {
  console.error('❌ Login Failed');
  // Handle the error gracefully
  console.error(error.response?.data || error.message);
});
