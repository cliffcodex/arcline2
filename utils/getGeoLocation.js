import axios from 'axios';

async function getLocationFromIp(ip) {
  ip = ip.replace('::ffff:', '');
  if (ip === '127.0.0.1' || ip === '::1') ip = '8.8.8.8'; // default for local dev

  try {
    const res = await axios.get(`http://ip-api.com/json/${ip}`);
    if (res.data.status === 'success') {
      const { city, regionName, country } = res.data;
      return `${city}, ${regionName}, ${country}`;
    } else {
      return 'Unknown';
    }
  } catch (err) {
    console.error('Geo error:', err.message);
    return 'Unknown';
  }
}

export default getLocationFromIp;
