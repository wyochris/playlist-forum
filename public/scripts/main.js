var rhit = rhit || {};
const apiURL = "https://lardner-zhang-final-csse280.web.app/api/"

rhit.FB_COLLECTION_PLAYLIST = "Playlists";
rhit.FB_COLLECTION_COMMENTS = "Comments";
rhit.FB_COLLECTION_SONGS = "Songs";
rhit.FB_KEY_PLAYLISTNAME = "playlistName";
rhit.FB_KEY_AUTHOR = "author";
rhit.playlistManager = null;
rhit.songPageManager = null;
rhit.authManager = null;


function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.Playlist = class {
	constructor(id, name) {
		this.id = id;
		this.playlistName = name;
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

rhit.PlaylistPageController = class {
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

rhit.PlaylistManager = class {
	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_PLAYLIST);
		this._unsubscribe = null;
 		}

	add(playlistName) {
		this._ref.add({
			[rhit.FB_KEY_AUTHOR]: rhit.authManager.uid,
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
