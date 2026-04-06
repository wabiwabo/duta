import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 },
    { duration: '30s', target: 100 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE = __ENV.BASE_URL || 'https://api.duta.val.id';

export default function () {
  // List campaigns (public endpoint)
  const res = http.get(`${BASE}/api/campaigns?status=active&limit=12`);
  check(res, {
    'status 200': (r) => r.status === 200,
    'has data': (r) => JSON.parse(r.body).data !== undefined,
  });
  sleep(1);
}
