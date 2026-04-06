import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '30s', target: 200 },
    { duration: '30s', target: 500 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.2'],
  },
};

const BASE = __ENV.BASE_URL || 'https://api.duta.val.id';

export default function () {
  http.get(`${BASE}/api/health`);
  sleep(0.3);
}
