// Native fetch in Node 18+

async function testLogin() {
    try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@police.gov.in',
                password: 'admin123'
            })
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Body:', text.substring(0, 500)); // Print first 500 chars to see if it's HTML
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testLogin();
