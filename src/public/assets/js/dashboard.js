function formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    let formattedUptime = '';

    if (days > 0) {
        formattedUptime += `${days} day${days > 1 ? 's' : ''} `;
    }
    if (hours > 0) {
        formattedUptime += `${hours} hour${hours > 1 ? 's' : ''} `;
    }
    if (minutes > 0) {
        formattedUptime += `${minutes} minute${minutes > 1 ? 's' : ''} `;
    }
    formattedUptime += `${secs} second${secs !== 1 ? 's' : ''}`;

    return formattedUptime.trim();
}


async function fetchStats() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log('Fetched stats:', data); // Log the entire stats object

        // Update fields in the dashboard
        document.getElementById('serverName').innerText = data.serverName || 'N/A';
        document.getElementById('memberCount').innerText = data.memberCount || 0;
        document.getElementById('serverStatus').innerText = data.serverStatus || 'Unknown';
        document.getElementById('uptime').innerText = data.uptime ? formatUptime(data.uptime) : 'N/A';
        document.getElementById('ping').innerText = data.ping || 'N/A';
        document.getElementById('commandsUsed').innerText = data.commandsUsed || 0;

        const lastCommands = data.lastCommands || []; // Default to an empty array if not present
        console.log('Last Commands:', lastCommands); // Check the structure of lastCommands
        
        // Ensure lastCommands is an array
        if (Array.isArray(lastCommands)) {
            const lastCommandsList = document.getElementById('lastCommands');
            lastCommandsList.innerHTML = ''; // Clear existing commands

            lastCommands.forEach(command => {
                const li = document.createElement('li');
                li.innerText = `${new Date(command.timestamp).toLocaleString()}: ${command.commandName} by ${command.user}`;
                lastCommandsList.appendChild(li);
            });
        } else {
            console.error('lastCommands is not an array:', lastCommands);
            // Optionally display a message in the UI
            lastCommandsList.innerHTML = '<li>No commands available.</li>';
        }

    } catch (error) {
        console.error('Failed to fetch stats:', error);
    }
}


// Fetch stats every 5 seconds to keep the dashboard updated
setInterval(fetchStats, 5000);

// Fetch stats on page load
fetchStats();
