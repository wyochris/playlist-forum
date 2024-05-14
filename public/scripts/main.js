var rhit = rhit || {};
const apiURL = "https://lardner-zhang-final-csse280.web.app/api/"

rhit.FB_COLLECTION_PLAYLIST = "Playlists";
rhit.FB_KEY_PLAYLISTNAME = "playlistName";
rhit.FB_KEY_AUTHOR = "author";

function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.Playlist = class {
	constructor(id, name) {
		this.id = id;
		this.name = name;
	}
}

rhit.Song = class {
	constructor(id, name) {
		this.id = id;
		this.name = name;		
	}
}

rhit.Comment = class {
	constructor(user, time, content) {
		this.user = user;
		this.time = time;
		this.content = content;
	}
}

rhit.PlaylistPageController = class {
	constructor() {
		document.getElementById("playlistsButton").onclick = (event) => {
			window.location.href = `/index.html`;
		};

		document.querySelector("#myQuotes").onclick = (event) => {
			//window.location.href = `/list.html?uid=${rhit.fbAuthManager.uid}`;
		};

		document.querySelector("#logout").onclick = (event) => {
			rhit.fbAuthManager.signOut();
		};

		document.querySelector("#submit").onclick = (event) => {
			const playlistName = document.querySelector("#playlistName").value;
			console.log(playlistName);
			rhit.fbMovieQuotesManager.add(playlistName);
		};

		$("#addPlaylist").on("show.bs.modal", (event) => {
			document.querySelector("#playlistName").value = "";
		});
		$("#addPlaylist").on("shown.bs.modal", (event) => {
			document.getElementById("playlistName").focus();
		});

		rhit.PlaylistManager.beginListening(this.updateList.bind(this));
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
		for (let i = 0; i < rhit.PlaylistManager.length; i++) {
			const pl = rhit.PlaylistManager.getPlaylistAtIndex(i);
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

rhit.PlaylistManager = class {
	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_MOVIEQUOTE);
		this._unsubscribe = null;
 		}

	add(playlistName) {
		this._ref.add({
			[rhit.FB_KEY_AUTHOR]: rhit.fbAuthManager.uid,
			[rhit.FB_KEY_PLAYLISTNAME]: playlistName,
		})
	}

	beginListening(changeListener) {
		let query = this._ref
		.limit(50);

		if(this._uid){
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this._uid);
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
		const pl = new rhit.Playlist(
			snap.id,
			snap.get(rhit.FB_KEY_PLAYLISTNAME),
		);
		return pl;
	}
}



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
