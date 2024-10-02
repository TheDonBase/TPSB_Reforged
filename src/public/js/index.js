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
                const data = await response.json();

                document.getElementById('server-name').textContent = data.serverName;
                document.getElementById('member-count').textContent = data.memberCount;

                const serverStatusElement = document.getElementById('server-status');
                serverStatusElement.textContent = data.serverStatus;

                // Change color based on server status
                if (data.serverStatus === 'Online') {
                    serverStatusElement.style.color = 'green'; // Green for Online
                } else {
                    serverStatusElement.style.color = 'red'; // Red for Offline
                }

                document.getElementById('uptime').textContent = `${Math.floor(data.uptime / 60)} minutes`;
                document.getElementById('ping').textContent = data.ping;
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        }

        // Fetch stats every 5 seconds
        setInterval(fetchStats, 5000);

        // Fetch stats on page load
        fetchStats();