async function fetchStats() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const stats = await response.json();

        // Update the UI with the fetched stats
        document.getElementById('memberCount').textContent = stats.memberCount || '0';
        document.getElementById('commandsUsed').textContent = stats.commandsUsed || '0';
        document.getElementById('uptime').textContent = stats.uptime ? Math.floor(stats.uptime) : '0';
        document.getElementById('ping').textContent = stats.ping || '0';
        
        // Display last commands
        const lastCommandsContainer = document.getElementById('lastCommands');
        lastCommandsContainer.innerHTML = ''; // Clear previous commands
        stats.lastCommands.forEach(command => {
            const commandElement = document.createElement('li');
            commandElement.textContent = command;
            lastCommandsContainer.appendChild(commandElement);
        });
    } catch (error) {
        console.error('Failed to fetch stats:', error);
    }
}

// Fetch stats every 5 seconds to keep the dashboard updated
setInterval(fetchStats, 5000);

// Fetch stats on page load
fetchStats();
