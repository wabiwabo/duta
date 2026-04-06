import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 30 },
    { duration: '1m', target: 100 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE = __ENV.BASE_URL || 'https://api.duta.val.id';

export default function () {
  group('Health', () => {
    const res = http.get(`${BASE}/api/health`);
    check(res, { 'health ok': (r) => r.status === 200 });
  });

  group('Campaigns List', () => {
    const res = http.get(`${BASE}/api/campaigns?status=active&limit=12`);
    check(res, { 'campaigns ok': (r) => r.status === 200 });
  });

  group('Swagger Docs', () => {
    const res = http.get(`${BASE}/api/docs-json`);
    check(res, { 'docs ok': (r) => r.status === 200 });
  });

  sleep(Math.random() * 2 + 0.5);
}
