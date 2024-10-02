document.getElementById('messageForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const channelId = document.getElementById('channelId').value;
    const message = document.getElementById('message').value;

    try {
        const response = await fetch('/api/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ channelId, message })
        });

        if (!response.ok) {
            throw new Error('Failed to send message');
        }

        const result = await response.json();
        alert(result.success ? 'Message sent!' : 'Error sending message');
    } catch (error) {
        console.error('Error sending message:', error);
        alert('An error occurred.');
    }
});

async function fetchStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        document.getElementById('server-name').innerText = stats.serverName;
        document.getElementById('member-count').innerText = stats.memberCount;
        document.getElementById('server-status').innerText = stats.serverStatus;
        document.getElementById('uptime').innerText = `${Math.floor(stats.uptime / 60)} minutes`;
        document.getElementById('ping').innerText = `${stats.ping} ms`;
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

// Fetch stats every 5 seconds
setInterval(fetchStats, 5000);

// Fetch stats on page load
fetchStats();