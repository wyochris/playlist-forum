const apiURL = "https://lardner-zhang-final-csse280.web.app/api/"


main = function () {
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
async function updateSongCards(searchQuery) {
	fetch(`http://localhost:5001/lardner-zhang-final-csse280/us-central1/api/search/${searchQuery}`)
	//   .then(response => response.json())
	  .then(data => {
		const searchResultsContainer = document.getElementById('searchResults');
		searchResultsContainer.innerHTML = ''; // Clear previous content
		console.log('data fetching');
		var firstPage = data.body.tracks.items;
		console.log('I got ' + data.body.tracks.total + ' results!');
		firstPage.forEach(function(track, index) {
			console.log(index + ': ' + track.name + ' (' + track.popularity + ')');
		  });

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

		  console.log(track.name);
		  
		  cardBody.appendChild(image);
		  cardBody.appendChild(songTitle);
		  card.appendChild(cardBody);
		  searchResultsContainer.appendChild(card);
		});
	  })
	  .catch(error => console.error('Error updating song cards:', error));

	console.log("fetch finish");
  }
  
  // when search button clicked
 async function handleSearch() {
	const searchQuery = document.getElementById('searchInput').value;
	await updateSongCards(searchQuery);
	window.location.href = `/results.html?query=${encodeURIComponent(searchQuery)}`;
  }
  

main();
