const fetch = require('node-fetch'); // we can just use native fetch in node 18+
async function test() {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'aarav@test.com', password: 'password123' })
  });
  const data = await res.json();
  console.log(data);
}
test();
