# Duta Load Tests (k6)

## Quick Start
```bash
# Smoke test
k6 run load-tests/health.js

# Campaign endpoints
k6 run load-tests/campaigns.js

# Mixed traffic simulation
k6 run load-tests/mixed.js

# Stress test (find breaking point)
k6 run load-tests/stress.js

# Custom base URL
k6 run -e BASE_URL=http://localhost:3001 load-tests/health.js
```
