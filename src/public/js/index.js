async function fetchStats() {
    try {
        console.log('Fetching stats from the server...');
        const response = await fetch('/api/stats');

        // Log the response status
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
            console.error('Failed to fetch stats:', response.statusText);
            return; // Exit if the response is not OK
        }

        const data = await response.json();

        // Log the retrieved data
        console.log('Retrieved data:', data);

        // Update the UI with the fetched data
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
        document.getElementById('sent').textContent = data.sent;

    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

async function fetchCommandLog() {
    try {
        console.log('Fetching command log from the server...');
        const response = await fetch('/api/commands');

        // Log the response status
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
            console.error('Failed to fetch stats:', response.statusText);
            return; // Exit if the response is not OK
        }

        const data = await response.json();

        // Log the retrieved data
        console.log('Retrieved data:', data);

        const commandLogList = document.getElementById('commandLogList');

        // Clear previous logs
        commandLogList.innerHTML = '';

        // Loop through the command logs and create list items
        commandLogs.forEach(log => {
            const listItem = document.createElement('li');
            listItem.textContent = `${log.timestamp} - ${log.user} executed command: ${log.commandName}`; // Format the log entry
            commandLogList.appendChild(listItem);
        });

    } catch (error) {
        console.error('Error fetching command logs:', error);
    }
}

// Fetch stats every 60 seconds
setInterval(fetchStats, 60000);
setInterval(fetchCommandLog, 60000);

// Fetch stats on page load
fetchStats();