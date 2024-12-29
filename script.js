document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const menuItemsVertical = document.querySelector('.menu-items-vertical');
  const menuTitleWrapper = document.querySelector('.menu-title-wrapper');
  const boxes = document.querySelectorAll('.box');
  const boxes2 = document.querySelectorAll('.box2');

  let isMenuVisible = false;

  const showMenu = () => {
    menuItemsVertical.style.display = 'flex';
    menuItemsVertical.style.opacity = '0';
    menuItemsVertical.style.visibility = 'visible';
    menuItemsVertical.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      menuItemsVertical.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      menuItemsVertical.style.opacity = '1';
      menuItemsVertical.style.transform = 'translateY(0)';
      isMenuVisible = true;
    }, 10);
  };

  const hideMenu = () => {
    menuItemsVertical.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    menuItemsVertical.style.opacity = '0';
    menuItemsVertical.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      menuItemsVertical.style.visibility = 'hidden';
      menuItemsVertical.style.display = 'none';
      isMenuVisible = false;
    }, 400);
  };

  menuToggle.addEventListener('click', () => {
    if (isMenuVisible) {
      hideMenu();
    } else {
      showMenu();
    }
  });

  menuToggle.addEventListener('mouseenter', showMenu);
  menuTitleWrapper.addEventListener('mouseenter', showMenu);
  menuItemsVertical.addEventListener('mouseenter', showMenu);

  document.addEventListener('mousemove', (e) => {
    const withinToggle = menuToggle.contains(e.target);
    const withinWrapper = menuTitleWrapper.contains(e.target);
    const withinMenu = menuItemsVertical.contains(e.target);

    if (!withinToggle && !withinWrapper && !withinMenu) {
      hideMenu();
    }
  });

  boxes.forEach(box => {
    box.addEventListener('mouseenter', () => {
      box.style.transform = 'scale(1.19)';
      box.style.borderColor = '#949E90';
      box.style.backgroundColor = 'transparent';
      box.style.zIndex = '10';
    });
    box.addEventListener('mouseleave', () => {
      box.style.transform = 'scale(1)';
      box.style.backgroundColor = '#181C14';
      box.style.zIndex = '1';
      box.style.borderColor = 'transparent';
    });
  });

  boxes2.forEach(box2 => {
    box2.addEventListener('mouseenter', () => {
      box2.style.transform = 'scale(1.05)';
      box2.style.backgroundColor = 'rgba(40, 46, 33, 0.99)';
      box2.style.zIndex = '10';
    });
    box2.addEventListener('mouseleave', () => {
      box2.style.transform = 'scale(1)';
      box2.style.backgroundColor = 'rgba(40, 46, 33, 0.9)';
      box2.style.zIndex = '1';
    });
  });
});

// Wait for the page to fully load
document.addEventListener("DOMContentLoaded", () => {
  const loadingScreen = document.getElementById("loading-screen");
  const quoteDisplay = document.getElementById("quote-display");

  // List of Quotes
  const quotes = [
    "“All men by nature desire knowledge.” — Aristotle",
    "“In the middle of winter, I found there was within me an invincible summer.” — Albert Camus",
    "“Time reveals all things.” — Sophocles",
    "“Know thyself.” — Socrates",
    "“Man is the only creature who refuses to be what he is.” — Albert Camus",
    "“Happiness depends upon ourselves.” — Aristotle",
    "“Art is the lie that enables us to realize the truth.” — Pablo Picasso"
  ];

  // Function to Get a Random Quote
  const getRandomQuote = () => {
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  // Set Initial Quote Immediately
  quoteDisplay.textContent = getRandomQuote();

  // Update Quote Every 4 Seconds
  const quoteInterval = setInterval(() => {
    quoteDisplay.textContent = getRandomQuote();
  }, 4000); // Change every 4 seconds

  // Fade-out effect for the loading screen
  setTimeout(() => {
    loadingScreen.style.opacity = "0";  // Smooth fade-out
    setTimeout(() => {
      loadingScreen.style.display = "none"; // Hide the loading screen
      clearInterval(quoteInterval);  // Stop quote rotation
    }, 1000);  // Give fade-out effect time to complete
  }, 1000);  // Keep loading screen visible for 3 seconds
});

// Validate input before redirecting
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

async function searchBlog() {
  const query = document.getElementById('search-input').value;

  // Validate input before proceeding
  if (!validateInput(query)) {
    return; // Stop if input is invalid
  }

  // Redirect to results page with encoded query
  window.location.href = `results.html?query=${encodeURIComponent(query)}`;
}

// Listen for the Enter key in the search input
document.getElementById('search-input').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') { // Check if the pressed key is Enter
    searchBlog();
  }
});