async function fetchStats() {
    try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log('Fetched stats:', data); // Log the entire stats object

        const lastCommands = data.lastCommands || []; // Default to an empty array if not present
        console.log('Last Commands:', lastCommands); // Check the structure of lastCommands

        // Ensure lastCommands is an array
        if (Array.isArray(lastCommands)) {
            const lastCommandsList = document.getElementById('commands-list');
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
