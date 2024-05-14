var rhit = rhit || {};
const apiURL = "https://lardner-zhang-final-csse280.web.app/api/"


rhit.main = function () {
	console.log("Ready");
	document.getElementById("songsButton").onclick = (event) => {
		window.location.href = `/songs.html`;
	};
	document.getElementById("playlistsButton").onclick = (event) => {
		window.location.href = `/index.html`;
	};
	document.getElementById("detailsButton").onclick = (event) => {
		window.location.href = `/details.html`;
	};
};

// Function to fetch Spotify data and update song cards
function updateSongCards(searchQuery) {
	fetch(`/search?query=${encodeURIComponent(searchQuery)}`)
	  .then(response => response.json())
	  .then(data => {
		const searchResultsContainer = document.getElementById('searchResults');
		searchResultsContainer.innerHTML = ''; // Clear previous content
		
		data.forEach(track => {
		  const card = document.createElement('div');
		  card.className = 'card';
		  const cardBody = document.createElement('div');
		  cardBody.className = 'card-body';
		  const image = document.createElement('img');
		  image.src = track.album.images[0].url;
		  image.className = 'img-fluid';
		  const songTitle = document.createElement('p');
		  songTitle.textContent = track.name;
		  
		  cardBody.appendChild(image);
		  cardBody.appendChild(songTitle);
		  card.appendChild(cardBody);
		  searchResultsContainer.appendChild(card);
		});
	  })
	  .catch(error => console.error('Error updating song cards:', error));
  }
  
  // when search button clicked
  function handleSearch() {
	const searchQuery = document.getElementById('searchInput').value;
	window.location.href = `/results.html?query=${encodeURIComponent(searchQuery)}`;
  }
  

rhit.main();
