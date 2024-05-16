const apiURL = "https://lardner-zhang-final-csse280.web.app/api/"

var rhit = rhit || {};

rhit.FB_COLLECTION_PLAYLIST = "Playlists";
rhit.FB_COLLECTION_COMMENTS = "Comments";
rhit.FB_COLLECTION_SONGS = "Songs";
rhit.FB_KEY_PLAYLISTNAME = "playlistName";
rhit.FB_KEY_AUTHOR = "author";
rhit.playlistManager = null;
rhit.songPageManager = null;
rhit.authManager = null;

FB_COLLECTION_PLAYLIST = "Playlists";
FB_KEY_PLAYLISTNAME = "playlistName";
FB_KEY_AUTHOR = "author";

function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

Playlist = class {
	constructor(id, name) {
		this.id = id;
		this.playlistName = name;
	}
}

Song = class {
	constructor(id, name) {
		this.id = id;
		this.name = name;		
	}
}

Comment = class {
	constructor(user, time, content) {
		this.user = user;
		this.time = time;
		this.content = content;
	}
}

rhit.authManager = class{
	constructor() {
		this.user = null;
	}

	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}

	signIn() {
		firebase.auth().signInAnonymously();
	}

	// signIn() {
	// 	Rosefire.signIn("db6d8a32-9c4c-4f18-adb7-d5eaec480b32", (err, rfUser) => {
	// 		if (err) {
	// 			console.log("Rosefire error!", err);
	// 			return;
	// 		}
	// 		console.log("Rosefire success!", rfUser);

	// 		firebase.auth().signInWithCustomToken(rfUser.token);
	// 	});
	// }
	signOut() { firebase.auth().signOut(); }
	get uid() { return this._user.uid; }
	get isSignedIn() { return !!this._user; }
}

PlaylistPageController = class {
	constructor() {
		document.getElementById("playlistsButton").onclick = (event) => {
			window.location.href = `/index.html`;
		};

		

		document.querySelector("#logOutButton").onclick = (event) => {
			rhit.authManager.signIn();
		};

		document.querySelector("#submit").onclick = (event) => {
			const playlistName = document.querySelector("#playlistName").value;
			console.log(playlistName);
			rhit.playlistManager.add(playlistName);
		};

		$("#addPlaylist").on("show.bs.modal", (event) => {
			document.querySelector("#playlistName").value = "";
		});
		$("#addPlaylist").on("shown.bs.modal", (event) => {
			document.getElementById("playlistName").focus();
		});

		rhit.playlistManager.beginListening(this.updateList.bind(this));
	}

	_createCard(pl) {
		//console.log(mq.quote);
		return htmlToElement(`<div class="card">
        <div class="card-body">
          <image src="https://i.scdn.co/image/ab67616d0000485102d63d77b84d4927a80d5252">&nbsp; ${pl.playlistName}</image>
        </div>
      </div>`);
	}

	updateList() {
		const newList = htmlToElement('<div id="listContainer"></div>');
		for (let i = 0; i < rhit.playlistManager.length; i++) {
			const pl = rhit.playlistManager.getPlaylistAtIndex(i);
			const newCard = this._createCard(pl);
			newCard.onclick = (event) => {
				window.location.href = `/songs.html?id=${pl.id}`;
			};
			newList.appendChild(newCard);
		}
		const oldList = document.querySelector("#listContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;

		oldList.parentElement.appendChild(newList);
	}
}

PlaylistManager = class {
	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_PLAYLIST);
		this._ref = firebase.firestore().collection(FB_COLLECTION_MOVIEQUOTE);
		this._unsubscribe = null;
 		}

	add(playlistName) {
		this._ref.add({
			[rhit.FB_KEY_AUTHOR]: rhit.authManager.uid,
			[rhit.FB_KEY_PLAYLISTNAME]: playlistName,
			[FB_KEY_AUTHOR]: fbAuthManager.uid,
			[FB_KEY_PLAYLISTNAME]: playlistName,
		})
	}

	beginListening(changeListener) {
		let query = this._ref
		.limit(50);

		if(this._uid){
			query = query.where(FB_KEY_AUTHOR, "==", this._uid);
		}

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
				this._documentSnapshots = querySnapshot.docs;
				changeListener();
			});
	}

	stopListening() {
		this._unsubscribe();
	}

	get length() {
		return this._documentSnapshots.length;
	}

	getPlaylistAtIndex(index) {
		const snap = this._documentSnapshots[index];
		const pl = new Playlist(
			snap.id,
			snap.get(FB_KEY_PLAYLISTNAME),
		);
		console.log(pl.id + ", " + pl.playlistName);
		return pl;
	}
}

rhit.SongPageController 

rhit.SongPageManager

rhit.initializePage = function () {
	const urlParams = new URLSearchParams(window.location.search);
	if (document.querySelector("#mainPage")) {
		const uid = urlParams.get("uid");
		rhit.playlistManager = new rhit.PlaylistManager(uid);
		new rhit.PlaylistPageController();
	}	
};


rhit.main = function () {
	console.log("Ready");
	rhit.authManager = new rhit.authManager();
	rhit.authManager.beginListening(() => {
		console.log(`The auth state has changed.   isSignedIn = ${rhit.authManager.isSignedIn}`);
		//rhit.checkForRedirects();
		rhit.initializePage();
	});
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

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM ready");

    const searchForm = document.getElementById("searchForm");
    if (searchForm) {
        new ResultPageController();
    }

    setupNavigation();
});

function setupNavigation() {
    const buttons = {
        songsButton: "/songs.html",
        playlistsButton: "/index.html",
        detailsButton: "/details.html",
        resultsButton: "/results.html"
    };

    Object.keys(buttons).forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.onclick = () => {
                window.location.href = buttons[buttonId];
            };
        }
    });
}

ResultPageController = class {
	constructor() {
		document.getElementById("searchForm").onsubmit = (event) => {
			event.preventDefault();
			console.log("Form submitted")
			this.handleSearch();
		};
	}

	handleSearch() {
		const searchQuery = document.getElementById('searchInput').value;
		console.log('handle search start');
		this.updateSongCards(searchQuery);
	}

	updateSongCards(searchQuery) {
        console.log('querying API');
        fetch(`http://localhost:5001/lardner-zhang-final-csse280/us-central1/api/search/${searchQuery}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('API response:', data);  // Log the data 
            // Assume data is an array of tracks or a single track object
			const searchResultsContainer = document.getElementById('searchResults');
            if (Array.isArray(data)) {
                data.forEach(track => {
                    const card = this.createSongCard(track);
                    searchResultsContainer.appendChild(card);
                });
            } else {
                throw new Error('Unexpected data format');
            }
        })
        .catch(error => {
            console.error('Error updating song cards:', error);
        });
    }
    
	createSongCard(track) {
		const card = document.createElement('div');
		card.className = 'card';
	
		const cardBody = document.createElement('div');
		cardBody.className = 'card-body';
		cardBody.style.display = 'flex';  // Set the display to flex
		cardBody.style.alignItems = 'center';  // Align items vertically
	
		const image = document.createElement('img');
		image.src = track.album.images[0].url;
		image.className = 'img-fluid';
		image.style.width = '100px';  // Set a fixed width for the image
		image.style.height = '100px';  // Set a fixed height for the image
		image.style.marginRight = '20px';  // Add some margin to the right of the image
		cardBody.appendChild(image);
	
		const textContent = document.createElement('div');
	
		const songTitle = document.createElement('h5');
		songTitle.className = 'card-title';
		songTitle.textContent = track.name;
		textContent.appendChild(songTitle);
	
		if (track.artists && track.artists.length > 0) {
			const artistName = document.createElement('p');
			artistName.className = 'card-text';
			artistName.textContent = "Artist: " + track.artists.map(artist => artist.name).join(", ");
			textContent.appendChild(artistName);
		}
	
		cardBody.appendChild(textContent);  // Add the text content next to the image
		card.appendChild(cardBody);
		return card;
	}
	
	

}