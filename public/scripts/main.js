const apiURL = "https://lardner-zhang-final-csse280.web.app/api/"

var rhit = rhit || {};

rhit.FB_COLLECTION_PLAYLIST = "Playlists";
rhit.FB_COLLECTION_COMMENTS = "Comments";
rhit.FB_COLLECTION_SONGS = "Songs";
rhit.FB_KEY_PLAYLISTNAME = "playlistName";
rhit.FB_KEY_AUTHOR = "author";
rhit.FB_KEY_COMMENTER = "Commenter";
rhit.FB_KEY_CONTENT = "Content";
rhit.FB_KEY_LAST_TOUCHED = "Modified";
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
				window.location.href = `/songs.html?pid=${pl.id}`;
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

rhit.SongPageController = class {
	constructor() {
		document.getElementById("playlistsButton").onclick = (event) => {
			window.location.href = `/index.html`;
		};

		// document.querySelector("#logOutButton").onclick = (event) => {
		// 	rhit.authManager.signIn();
		// };

		document.querySelector("#addCommentButton").onclick = (event) => {
			const content = document.querySelector("#commentContent").value;
			console.log(content);
			rhit.songPageManager.addComment(content);
		};

		rhit.songPageManager.beginListening(this.updateComment.bind(this));
	}

	_createComment(cm) {
		console.log("creating" + cm.Content);
		return htmlToElement(`<div class="card">
		<div class="card-body">
		  <image class="profile-picture" src="https://yt3.ggpht.com/a/default-user=s88-c-k-c0x00ffffff-no-rj"></image>
		  
		  <h5 id="author">${cm.Commenter} | ${cm.Modified}</h5>
		  <h4 id="content">${cm.Content}</h4 >
			
		  </div>
		</div>`);
	}

	updateComment() {
		const newList = htmlToElement('<div id="commentContainer" class="offcanvas-body small"></div>');
		for (let i = 0; i < rhit.songPageManager.commentLength; i++) {
			const cm = rhit.songPageManager.getComment(i);
			const newCard = this._createComment(cm);
			newList.appendChild(newCard);
		}
		const oldList = document.querySelector("#commentContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;

		oldList.parentElement.appendChild(newList);
		console.log("updating finished");
	}
}

rhit.SongPageManager = class {
	constructor(pid) {
		this._documentSnapshots = [];
		this._commRef = firebase.firestore().collection(rhit.FB_COLLECTION_PLAYLIST).doc(pid).collection(rhit.FB_COLLECTION_COMMENTS);
		this._unsubscribe = null;
 		}

	addComment(content) {
		console.log("adding " + content);
		this._commRef.add({
			[rhit.FB_KEY_COMMENTER]: rhit.authManager.uid,
			[rhit.FB_KEY_CONTENT]: content,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),			
		})
	}

	beginListening(changeListener) {
		console.log("listening");
		let query = this._commRef
		.limit(50);

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
				this._documentSnapshots = querySnapshot.docs;
				changeListener();
			});
		console.log("listening done");
	}

	stopListening() {
		this._unsubscribe();
	}

	get length() {
		return this._documentSnapshots.length;
	}

	getComment(index) {
		const snap = this._documentSnapshots[index];
		const cm = new Playlist(
			snap.get(FB_KEY_COMMENTER),
			snap.get(FB_KEY_LAST_TOUCHED),
			snap.get(FB_KEY_CONTENT),
		);
		//console.log(pl.id + ", " + pl.playlistName);
		return cm;
	}
}

rhit.initializePage = function () {
	const urlParams = new URLSearchParams(window.location.search);
	if (document.querySelector("#mainPage")) {
		const uid = urlParams.get("uid");
		rhit.playlistManager = new rhit.PlaylistManager(uid);
		new rhit.PlaylistPageController();
	}	
	if (document.querySelector("#songsPage")) {
		const pid = urlParams.get("pid");
		rhit.songPageManager = new rhit.SongPageManager(pid);
		new rhit.SongPageController();
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
		document.getElementById('searchInput').value = '';
	}

	updateSongCards(searchQuery) {
        console.log('querying API');
        fetch(`https://us-central1-lardner-zhang-final-csse280.cloudfunctions.net/api/search/${searchQuery}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('API response:', data);
            // data is an array
			const searchResultsContainer = document.getElementById('searchResults');
			searchResultsContainer.innerHTML = '';
            if (Array.isArray(data)) {
                data.forEach((track, index) => {
                    const card = this.createSongCard(track);

					if (index === data.length - 1) {
						card.classList.add('last-card'); // for css
					}
					
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
		card.className = 'card d-flex flex-row align-items-center justify-content-between';
	
		const cardBody = document.createElement('div');
		cardBody.className = 'card-body';
		cardBody.style.display = 'flex';  
		cardBody.style.alignItems = 'center'; 
	
		const image = document.createElement('img');
		image.src = track.album.images[0].url;
		image.className = 'img-fluid';
		image.style.width = '100px';  
		image.style.height = '100px';  
		image.style.marginRight = '20px';  
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
	
		cardBody.appendChild(textContent); 
		card.appendChild(cardBody);

		const dropdown = document.createElement('div');
		dropdown.className = 'dropdown';
	
		const dropButton = document.createElement('button');
		dropButton.className = 'btn btn-secondary dropdown-toggle btn-outline-primary';
		dropButton.type = 'button';
		dropButton.id = 'dropdownMenuButton';
		dropButton.dataset.toggle = 'dropdown';
		dropButton.innerText = '+';
	
		const dropdownMenu = document.createElement('div');
		dropdownMenu.className = 'dropdown-menu';
		dropdownMenu.setAttribute('aria-labelledby', 'dropdownMenuButton');
	
		// Function to populate dropdown
		this.populateDropdown(dropdownMenu, track);
	
		dropdown.appendChild(dropButton);
		dropdown.appendChild(dropdownMenu);
		card.appendChild(dropdown);

		return card;
	}

	populateDropdown(menu, track) {
		const db = firebase.firestore();
		db.collection('Playlists').get().then(querySnapshot => {
			querySnapshot.forEach(doc => {
				const playlistName = doc.data().playlistName; //playlistName field
				const option = document.createElement('a');
				option.className = 'dropdown-item';
				option.href = '#';
				option.textContent = playlistName;
				option.onclick = () => this.addSongToPlaylist(track, doc.id); // Use the doc ID 
				menu.appendChild(option);
			});
		}).catch(error => {
			console.error("Error getting playlists:", error);
	});
	}

	//firebase things
	addSongToPlaylist(track, playlistId) {
		const db = firebase.firestore(); 
		const playlistRef = db.collection('Playlists').doc(playlistId);
		console.log(track);
		console.log(track.type);

		const songData = {
			spotifyId: track.id,
			title: track.name,
			// artist: track.artists[0].name, // only first
			artist: track.artists.map(artist => artist.name).join(", "), // more than one
			albumName: track.album.name,
			albumImageUrl: track.album.images[0].url, 
			releaseDate: track.album.release_date,
			trackNumber: track.track_number,
			durationMs: track.duration_ms,
			previewUrl: track.preview_url,
			popularity: track.popularity,
			explicit: track.explicit,
			addedOn: new Date() // Timestamp
		};
	
		// Check if the song already exists in the playlist
		playlistRef.collection('songs').doc(track.id).get().then(doc => {
			if (!doc.exists) {
				// If not, add it
				playlistRef.collection('songs').doc(track.id).set(songData)
				.then(() => {
					console.log('Song added to playlist successfully!');
				})
				.catch(error => {
					console.error('Error adding song to playlist:', error);
				});
			} else {
				console.log('Song already exists in the playlist');
			}
		});
	}
	
}

DetailsPageManager = class { 
	constructor(songID){
		const db = firebase.firestore(); 
	}



}