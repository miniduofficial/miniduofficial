document.addEventListener("DOMContentLoaded", () => {
    const loadingScreen = document.getElementById("loading-screen");
    const quoteDisplay = document.getElementById("quote-display");
  
    // Quotes for the loading screen
    const quotes = [
    "“He who has a why to live can bear almost any how.” — Friedrich Nietzsche",
    "“In the middle of winter, I found there was within me an invincible summer.” — Albert Camus",
    "“You could leave life right now. Let that determine what you do and say and think.” — Marcus Aurelius",
    "“Life can only be understood backwards; but it must be lived forwards.” — Søren Kierkegaard:",
    "“One must imagine Sisyphus happy.” — Albert Camus",
    "“Amor fati: love your fate, which is in fact your life.” — Friedrich Nietzsche",
    "“Imitation is the sincerest form of flattery that mediocrity can pay to greatness.”— Oscar Wilde"
    ];
  
    const getRandomQuote = () => quotes[Math.floor(Math.random() * quotes.length)];
    quoteDisplay.textContent = getRandomQuote();
  
    const quoteInterval = setInterval(() => {
      quoteDisplay.textContent = getRandomQuote();
    }, 4000);
  
    setTimeout(() => {
      loadingScreen.style.opacity = "0";
      setTimeout(() => {
        loadingScreen.style.display = "none";
        clearInterval(quoteInterval);
      }, 1000);
    }, 1000);
  });
  
  // Extract and validate query from URL
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('query');
  
  function validateInput(input) {
    const trimmedInput = input.trim();
  
    if (!trimmedInput) {
      alert("Query cannot be empty. Please enter a valid search term.");
      return false;
    }
  
    if (trimmedInput.length > 100) {
      alert("Query is too long. Please limit it to 100 characters.");
      return false;
    }
  
    const validPattern = /^[a-zA-Z0-9\s,.!?]+$/;
    if (!validPattern.test(trimmedInput)) {
      alert("Query contains invalid characters. Please use only letters, numbers, and basic punctuation.");
      return false;
    }
  
    return true;
  }
  
  if (query) {
    if (validateInput(query)) {
      fetchResults(query); // Fetch results if valid
    } else {
      const container = document.getElementById('results-container');
      container.innerHTML = '<p>Invalid input. Please try again.</p>';
      hideLoadingScreen();
    }
  } else {
    document.getElementById('results-container').innerHTML = '<p>No query provided.</p>';
    hideLoadingScreen();
  }
  
async function fetchResults(query) {
    try {
        const response = await fetch('https://blog-backend-production-7a52.up.railway.app/search', { // Correct API URL
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: query }),
        });

        if (!response.ok) {
            console.error('Error with response:', response.status, response.statusText);
            throw new Error('Failed to fetch results.');
        }

        const results = await response.json();
        displayResults(results);
    } catch (error) {
        console.error("Error fetching search results:", error);
        const container = document.getElementById('results-container');
        container.innerHTML = '<p>Failed to load search results. Please try again later.</p>';
    }
}
  
function displayResults(results) {
    const container = document.getElementById('results-container');
  
    const filteredResults = results.filter(result => result.score >= 0.4);
  
    if (filteredResults.length === 0) {
      container.textContent = 'No relevant results found.';
      return;
    }
  
    filteredResults.forEach(result => {
      const resultDiv = document.createElement('div');
      resultDiv.classList.add('result');
  
      // Create a clickable title as a link
      const title = document.createElement('h3');
      const link = document.createElement('a');
      link.href = result.url;  // Ensure the backend includes this field
      link.textContent = result.title;
      link.style.textDecoration = "none";  // Optional: Remove underline
      link.style.color = "inherit";  // Optional: Keep text color consistent
      title.appendChild(link);
  
      // Content paragraph
      const content = document.createElement('p');
      content.textContent = result.content;
  
      resultDiv.appendChild(title);
      resultDiv.appendChild(content);
      container.appendChild(resultDiv);
    });
}
  
function hideLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen");
    loadingScreen.style.opacity = "0";
    setTimeout(() => {
      loadingScreen.style.display = "none";
    }, 1000);
}
