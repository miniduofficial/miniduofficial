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
    "“He who has a why to live can bear almost any how.” — Friedrich Nietzsche",
    "“In the middle of winter, I found there was within me an invincible summer.” — Albert Camus",
    "“You could leave life right now. Let that determine what you do and say and think.” — Marcus Aurelius",
    "“Life can only be understood backwards; but it must be lived forwards.” — Søren Kierkegaard:",
    "“One must imagine Sisyphus happy.” — Albert Camus",
    "“Amor fati: love your fate, which is in fact your life.” — Friedrich Nietzsche",
    "“Imitation is the sincerest form of flattery that mediocrity can pay to greatness.”— Oscar Wilde"
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
  });  // Keep loading screen visible for 3 seconds //Removed wait time till adjustements are made
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

// Search function
async function searchBlog(inputId) {
  const query = document.getElementById(inputId).value;

  // Validate input before proceeding
  if (!validateInput(query)) {
    return; // Stop if input is invalid
  }

  // Redirect to results page with encoded query
  window.location.href = `results.html?query=${encodeURIComponent(query)}`;
}

// Attach event listeners for Enter key
document.getElementById('search-input-large').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    searchBlog('search-input-large');
  }
});

document.getElementById('search-input-small').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    searchBlog('search-input-small');
  }
});

// Optionally attach click events for search buttons
document.getElementById('search-button-large').addEventListener('click', () => {
  searchBlog('search-input-large');
});

document.getElementById('search-button-small').addEventListener('click', () => {
  searchBlog('search-input-small');
});

document.addEventListener("scroll", () => {
  const parallaxImage = document.querySelector(".parallax-image");
  const scrollPosition = window.scrollY;

  // Adjust the transform property for the parallax effect
  parallaxImage.style.transform = `translateY(${scrollPosition * 0.3}px)`; // Adjust multiplier to change speed
});

document.addEventListener("DOMContentLoaded", () => {
  const backToTopButton = document.getElementById("back-to-top");

  const showButton = () => {
    if (!backToTopButton.classList.contains("visible")) {
      backToTopButton.style.display = "block";
      setTimeout(() => {
        backToTopButton.style.opacity = "1"; // Fully visible
        backToTopButton.classList.add("visible");
      }, 10); // Small delay to ensure display change is processed
    }
  };

  const hideButton = () => {
    if (backToTopButton.classList.contains("visible")) {
      backToTopButton.style.opacity = "0"; // Start fade-out
      setTimeout(() => {
        backToTopButton.style.display = "none"; // Hide after fading out
        backToTopButton.classList.remove("visible");
      }, 300); // Match the CSS transition duration
    }
  };

  window.addEventListener("scroll", () => {
    console.log("ScrollY:", window.scrollY);
    console.log("Button visible:", backToTopButton.classList.contains("visible"));

    if (window.scrollY > 200) {
      showButton();
    } else {
      hideButton();
    }
  });

  // Smooth scroll to the top on button click
  backToTopButton.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Smooth scrolling effect
    });

    // Optionally, fade out the button after scrolling to top
    setTimeout(() => {
      hideButton();
    }, 500); // Delay to match scrolling time
  });
});
