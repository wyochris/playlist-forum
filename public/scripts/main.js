const apiURL = "https://lardner-zhang-final-csse280.web.app/api/"

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
		this.name = name;
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

PlaylistPageController = class {
	constructor() {
		document.getElementById("playlistsButton").onclick = (event) => {
			window.location.href = `/index.html`;
		};

		document.querySelector("#myQuotes").onclick = (event) => {
			//window.location.href = `/list.html?uid=${fbAuthManager.uid}`;
		};

		document.querySelector("#logout").onclick = (event) => {
			fbAuthManager.signOut();
		};

		document.querySelector("#submit").onclick = (event) => {
			const playlistName = document.querySelector("#playlistName").value;
			console.log(playlistName);
			fbMovieQuotesManager.add(playlistName);
		};

		$("#addPlaylist").on("show.bs.modal", (event) => {
			document.querySelector("#playlistName").value = "";
		});
		$("#addPlaylist").on("shown.bs.modal", (event) => {
			document.getElementById("playlistName").focus();
		});

		PlaylistManager.beginListening(this.updateList.bind(this));
	}

	_createCard(playlistName) {
		//console.log(mq.quote);
		return htmlToElement(`<div class="card">
        <div class="card-body">
          <image src="https://i.scdn.co/image/ab67616d0000485102d63d77b84d4927a80d5252">&nbsp; ${playlistName}</image>
        </div>
      </div>`);
	}

	updateList() {
		const newList = htmlToElement('<div id="listContainer" class="container page-container"></div>');
		for (let i = 0; i < PlaylistManager.length; i++) {
			const pl = PlaylistManager.getPlaylistAtIndex(i);
			const newCard = this._createCard(pl);
			newCard.onclick = (event) => {
				window.location.href = `/details.html?id=${pl.id}`;
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
		this._ref = firebase.firestore().collection(FB_COLLECTION_MOVIEQUOTE);
		this._unsubscribe = null;
 		}

	add(playlistName) {
		this._ref.add({
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
		return pl;
	}
}

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